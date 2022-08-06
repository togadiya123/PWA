importScripts("https://www.gstatic.com/firebasejs/7.16.1/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/7.16.1/firebase-messaging.js");
importScripts("https://www.gstatic.com/firebasejs/7.16.1/firebase-analytics.js");
const firebaseConfig = {
    apiKey: "AIzaSyDOCAbC123dEf456GhI789jKl01-MnO",
    authDomain: "myapp-project-123.firebaseapp.com",
    databaseURL: "https://myapp-project-123.firebaseio.com",
    projectId: "myapp-project-123",
    storageBucket: "myapp-project-123.appspot.com",
    messagingSenderId: "65211879809",
    appId: "1:65211879909:web:3ae38ef1cdcb2e01fe5f0c",
};
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();
messaging.setBackgroundMessageHandler(function(payload) {
    // console.log(
    //     "[firebase-messaging-sw.js] Received background message ",
    //     payload,
    // );
    const notificationTitle = "Background Message Title";
    const notificationOptions = {
        body: "Background Message body.",
        image: "https://foo.bar/pizza-monster.png"
    };

    return self.registration.showNotification(
        notificationTitle,
        notificationOptions,
    );
});