# Bunny Stream integration

The application is ready for Bunny Stream uploads, management calls, playback,
and verified status webhooks. Bunny credentials stay on the Next.js server and
are never bundled into browser JavaScript.

## 1. Add the Vercel variables

In **Vercel > Project > Settings > Environment Variables**, copy every variable
from vercel-bunny.env.example. Apply them to Production, Preview, and
Development as needed, then redeploy.

Required:

- BUNNY_STREAM_LIBRARY_ID: numeric ID under **Stream > Library > API**.
- BUNNY_STREAM_API_KEY: Video Library API key from the same screen.
- BUNNY_STREAM_READ_ONLY_API_KEY: library Read-Only API key used by Bunny as
  the HMAC secret for signed webhooks.

Optional:

- BUNNY_STREAM_TOKEN_AUTH_KEY: set only after enabling **Embed View Token
  Authentication**. Playback then uses one-hour signed URLs after the existing
  Convex entitlement check.
- The URL and expiry variables already contain production-safe defaults.

Never prefix the API keys with NEXT_PUBLIC_.

## 2. Configure Bunny

1. In library security, allow production and Vercel preview hostnames that
   should embed videos.
2. Set the webhook URL to https://www.heycybercorp.fr/api/bunny/webhook.
3. Optionally enable Embed View Token Authentication and put its token key in
   BUNNY_STREAM_TOKEN_AUTH_KEY.

The Content Security Policy already permits Bunny's upload and player hosts.

## 3. Upload from the admin

Open a course under /admin/formations, add or edit a lesson, and select
**Televerser vers Bunny**. The browser uploads directly to Bunny with TUS, so
large files do not pass through Vercel. Uploads are resumable. On completion,
the player URL is inserted in the lesson form; save the lesson normally.

Only signed-in users whose Convex role is admin can create upload tickets or
use management endpoints.

## Application endpoints

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | /api/bunny/uploads | Admin | Create video and return presigned TUS credentials |
| GET | /api/bunny/playback/{lessonId} | Entitlement | Redirect to a Bunny embed |
| POST | /api/bunny/webhook | Bunny HMAC | Verify and acknowledge status changes |

Upload request fields are title, optional collectionId, and optional
thumbnailTime in milliseconds.

### Full management gateway

/api/bunny/manage/{path} maps to the configured Bunny library at
https://video.bunnycdn.com/library/{libraryId}/{path}. It forwards GET, POST,
PUT, PATCH, and DELETE, preserves query parameters and content type, injects
the server-side AccessKey, and only permits videos and collections resources.

| Local path | Typical operations |
| --- | --- |
| /api/bunny/manage/videos | list and create videos |
| /api/bunny/manage/videos/{videoId} | get, update, upload, delete |
| /api/bunny/manage/videos/fetch | import a remote video URL |
| /api/bunny/manage/videos/{videoId}/repackage | repackage all outputs |
| /api/bunny/manage/videos/{videoId}/outputs/{outputCodecId} | add an output codec |
| /api/bunny/manage/videos/{videoId}/transcribe | request transcription |
| /api/bunny/manage/videos/{videoId}/captions/{language} | captions |
| /api/bunny/manage/videos/{videoId}/thumbnail | set thumbnail |
| /api/bunny/manage/videos/{videoId}/play | retrieve play data |
| /api/bunny/manage/videos/{videoId}/play/heatmap | retrieve heatmap data |
| /api/bunny/manage/collections | list and create collections |
| /api/bunny/manage/collections/{collectionId} | get, update, delete |

For large local files, use /api/bunny/uploads and TUS. Do not send the binary
through the management gateway because Vercel request-size and duration limits
apply. The gateway follows Bunny's resource path so new operations under the
videos or collections trees remain available without exposing arbitrary hosts,
library IDs, or credentials. This means current and future Bunny Stream REST
operations nested below those two documented resources are already wired; no
new secret-bearing route is needed for each operation.
