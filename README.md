# Samewave

A two-person video-call prototype with real camera hand tracking. The interface and client code are in `index.html`; `server.mjs` provides temporary rooms and WebRTC signaling using only Node built-ins. No build step or package install is needed. Downloaded MediaPipe assets are in `vendor/`.

## Run

With Node.js 20 or newer:

```sh
node server.mjs
```

Open http://127.0.0.1:8000. To join from separate devices, expose **only this server** through an HTTPS reverse proxy or a temporary development tunnel:

```sh
cloudflared tunnel --url http://127.0.0.1:8000 --no-autoupdate
```

Open the HTTPS address, click **Start camera & join**, allow camera and microphone access, then click **Copy invite link**. Open that link on the second device and join there. Use headphones. The local server and tunnel must remain running. Temporary preview addresses change on restart. The local-only address is not a shareable second-device URL.

## Skip and meet someone new

Click **Skip person** below your partner’s video to immediately close the current call and clear the match. Your camera, microphone settings and hand tracker stay active for the next call. The server pairs you with the next eligible person waiting in the **same shared room**. Extra participants can join using that room’s invite link (up to 20 at a time); each call still has only two people. If nobody new is waiting, the app waits for another arrival. This is a room-based participant pool, not a global discovery service.

Skipped people will not be paired with each other again for the duration of those sessions. The other person also becomes available for a new pairing. A new conversation is not automatically a match: both people must still perform the same recognized gesture. Network errors during Skip keep the old call closed and offer **Retry skip**.

## Gestures

- **Heart:** two hands, index fingertips touching above touching thumb tips, palms facing the camera, leaving an opening between fingers and thumbs.
- **Circle:** one-hand OK sign, thumb/index tips touching with the other three fingers extended.
- Hold steady for roughly 1–2 seconds. Any equal supported gestures match, even if different from the suggested hint. Different gestures, missing hands, unknown poses, paused cameras, background tabs, expired detection data and disconnected calls do not match.

MediaPipe detects 21 hand landmarks per hand. Custom geometric rules identify these two shapes; this is **not a trained heart/circle classifier**. The implementation includes stabilization and freshness checks, but real-world accuracy depends on lighting, pose, occlusion and the camera. It has not been calibrated on a representative set of people. Synthetic geometry checks are not evidence of live recognition accuracy.

## Connections and privacy

WebRTC sends audio/video and gesture labels to the other participant. Camera frames are processed on-device and are not sent to the signaling server for recognition or recorded by this app. Room state and connection descriptions are held in server memory and expire. Room links are random bearer invitations: anyone who receives the link can join the waiting pool. This is a class prototype, not a production dating service with identity verification or moderation.

The default ICE configuration uses Cloudflare's public STUN endpoint. STUN cannot connect every pair of networks. For restricted NAT/firewalls, configure a TURN relay using `TURN_URL`, `TURN_USERNAME` and `TURN_CREDENTIAL` environment variables before starting the server. `TURN_URL` may contain comma-separated TURN/TURNS URLs. TURN credentials are passed to room clients, as required by WebRTC; use short-lived scoped credentials for a public deployment. No paid relay account is provisioned. HTTPS makes camera access available; it does not replace TURN.

Optional environment variables: `PORT` (default 8000), `PUBLIC_ORIGIN` (the HTTPS origin used for invite links). The server binds to loopback; use a reverse proxy/tunnel for remote access. It serves only the page and an explicit allowlist of model/runtime files, not the workspace or preview helper.

## Validate

```sh
node --check server.mjs
node test.mjs
```

Tests cover synthetic shape fixtures, gesture stabilization, every gesture pair, freshness/pause/disconnect handling, two-client room signaling, capacity, tokens, shared hints and leave/rejoin, plus skip, waiting participants, pair isolation and stale skip requests. A real two-device camera/audio call must still be checked manually; the tests do not exercise actual cameras, WebRTC transport or model inference.

## Sources

- [MediaPipe Hand Landmarker documentation](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/web_js)
- [WebRTC connection setup](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Connectivity)
- [Camera access and secure contexts](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [Temporary HTTPS preview tunnels](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/)

MediaPipe Tasks Vision is pinned to version 0.10.21. The hand landmarker model is the official float16 v1 asset. See `vendor/NOTICE.md` for origins and licenses.
