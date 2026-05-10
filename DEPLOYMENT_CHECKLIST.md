# CrisisConnect Deployment Checklist

## Frontend: Vercel

Set this environment variable in the Vercel project settings:

```env
NEXT_PUBLIC_API_URL=https://crisisconnect-r8ga.onrender.com
```

Redeploy the frontend after saving the variable so the Next.js build embeds the correct backend URL.

## Backend: Render

Set these environment variables in the Render service settings:

```env
CLIENT_URL=https://crisis-connect-three.vercel.app/
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_jwt_secret
```

Optional local/backend variable:

```env
PORT=5000
```

Redeploy the backend after saving the variables. The service now fails startup clearly if `MONGO_URI` or `JWT_SECRET` is missing.

## Verification

1. Open `https://crisisconnect-r8ga.onrender.com/api/health` and confirm it returns:

```json
{ "status": "OK" }
```

2. Open the Vercel app and test registration.
3. Sign out and test login with the same account.
4. Confirm protected dashboard requests load without CORS errors in the browser console.
5. If CORS fails, verify `CLIENT_URL` exactly matches the Vercel frontend origin. A trailing slash is accepted.
