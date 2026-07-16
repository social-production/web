See the backend security backlog: [web-backend/docs/SECURITY.md](https://github.com/social-production/web-backend/blob/main/docs/SECURITY.md).

Auth uses httpOnly cookies (`credentials: 'include'`). JWT is no longer stored in `localStorage`.

Adapter boundary audit: [ADAPTER_AUDIT.md](./ADAPTER_AUDIT.md).
