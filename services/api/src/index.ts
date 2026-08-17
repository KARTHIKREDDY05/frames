import { createApp } from "./app.js";
import { env } from "./runtime/env.js";

createApp().listen(env.PORT, () => {
  console.log(`Frames API listening on http://localhost:${env.PORT}`);
});
