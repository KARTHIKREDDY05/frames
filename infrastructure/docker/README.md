# Docker Notes

`docker compose up postgres redis` starts local infrastructure.

`docker compose up api worker` also starts the backend services after installing dependencies inside the containers.

For the first run, apply Prisma migrations from the host or API container:

```bash
pnpm db:migrate
pnpm seed
```
