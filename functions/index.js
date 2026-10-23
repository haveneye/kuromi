const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');
const { onDocumentUpdated } = require('firebase-functions/v2/firestore');

initializeApp();
const db = getFirestore();

exports.notifyParentsOfChildMessage = onDocumentUpdated(
  {
    document: 'artifacts/{appId}/public/data/profiles/{childName}',
    region: 'asia-northeast3'
  },
  async (event) => {
    if (!event.data) return;
    const before = event.data.before.data() || {};
    const after = event.data.after.data() || {};
    const previousIds = new Set(
      (Array.isArray(before.chatMessages) ? before.chatMessages : [])
        .map((message) => message && message.id)
        .filter(Boolean)
    );
    const addedChildMessages = (Array.isArray(after.chatMessages) ? after.chatMessages : [])
      .filter((message) => message && message.sender === 'child' && message.id && !previousIds.has(message.id));

    if (addedChildMessages.length === 0) return;

    const appId = event.params.appId;
    const childName = event.params.childName;
    const dataRoot = db.collection('artifacts').doc(appId).collection('public').doc('data');
    const configCollection = dataRoot.collection('config');
    const configSnapshot = await configCollection.get();
    const devices = configSnapshot.docs
      .map((deviceDoc) => ({ ref: deviceDoc.ref, token: deviceDoc.get('token') }))
      .filter((device) => typeof device.token === 'string' && device.token.length > 0);
    if (devices.length === 0) return;

    const settingsSnapshot = await configCollection.doc('pushSettings').get();
    const settings = settingsSnapshot.exists ? settingsSnapshot.data() : {};
    const appUrl = settings.appUrl || 'https://haveneye.github.io/kuromi/';

    for (const message of addedChildMessages) {
      const url = new URL(appUrl);
      url.searchParams.set('notifyChild', childName);
      const payload = {
        title: childName + '에게 메시지가 왔어요 💌',
        body: String(message.text || '쿠로미 메시지함에서 확인해보세요.').slice(0, 120),
        childName,
        messageId: String(message.id),
        url: url.toString()
      };

      for (let start = 0; start < devices.length; start += 500) {
        const batch = devices.slice(start, start + 500);
        const result = await getMessaging().sendEachForMulticast({
          tokens: batch.map((device) => device.token),
          data: payload,
          webpush: { headers: { Urgency: 'high' } }
        });
        const removals = [];
        result.responses.forEach((response, index) => {
          const code = response.error && response.error.code;
          if (!response.success && (
            code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-registration-token'
          )) removals.push(batch[index].ref.delete());
        });
        if (removals.length) await Promise.all(removals);
      }
    }
  }
);