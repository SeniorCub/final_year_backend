# Frontend Guide: Integrating Logout in Next.js

This guide explains how to integrate the new `/logout` endpoint in your **Next.js** frontend application.

---

## 1. The Logout Endpoint

* **URL**: `/api/auth/logout` (or `/auth/logout` depending on your API routing prefix)
* **Method**: `POST`
* **Headers**: 
  * `Content-Type: application/json`
  * `Authorization: Bearer <your_jwt_token>` (if your middleware requires JWT protection for all auth routes)
* **Response**:
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

### What the Backend Does
1. Manually clears the `token` cookie (if used) by returning a `Set-Cookie` header with an expired timestamp (`Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0`).
2. Returns a JSON success status.

---

## 2. Next.js Client-Side Logout (LocalStorage / SessionStorage)

If you store the JWT client-side in `localStorage` or `sessionStorage`, follow this implementation:

```tsx
'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');

      // 1. Call the backend logout API
      await fetch('https://your-api.com/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
    } catch (error) {
      console.error('Failed to log out on server:', error);
    } finally {
      // 2. Clear client-side token storage regardless of backend response
      localStorage.removeItem('token');

      // 3. Redirect to login page
      router.push('/login');
    }
  };

  return (
    <button 
      onClick={handleLogout}
      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
    >
      Sign Out
    </button>
  );
}
```

---

## 3. Next.js Secure Cookie Logout (App Router - Server Actions)

If you are using Next.js **Server Actions** and storing the JWT in secure HTTP-only cookies on the Next.js side, handle the logout process directly on the Next.js server side.

### Step A: Create the Server Action
Create an action file (e.g., `app/actions/auth.ts`):

```typescript
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function logoutAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  try {
    // 1. Notify the backend API of logout
    await fetch(`${process.env.BACKEND_API_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
  } catch (error) {
    console.error('Backend logout call failed:', error);
  }

  // 2. Delete Next.js cookies locally
  cookieStore.delete('token');

  // 3. Redirect user
  redirect('/login');
}
```

### Step B: Call Action from Client Component
```tsx
'use client';

import { logoutAction } from '@/app/actions/auth';
import { useTransition } from 'react';

export default function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(() => logoutAction())}
      className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
    >
      {isPending ? 'Logging out...' : 'Sign Out'}
    </button>
  );
}
```

---

> [!TIP]
> **Best Security Practice**:
> Always ensure you clear your client-side state (React contexts, Redux store, or local states) immediately during logout to prevent stale profile info or wallet credentials from remaining visible.

> [!WARNING]
> If your API is hosted on a different domain than your frontend (cross-origin), ensure CORS headers on the backend allow credentials/cookies if you rely on cookie propagation.
