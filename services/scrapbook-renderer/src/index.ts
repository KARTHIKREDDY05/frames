import type { PostDto } from "@frames/types";
import { dailyTemplates } from "@frames/templates";

export interface RenderInput {
  title: string;
  subtitle: string;
  posts: PostDto[];
  templateId?: string;
}

export function renderDailyFrameHtml(input: RenderInput) {
  const template = dailyTemplates.find((item) => item.id === input.templateId) ?? dailyTemplates[0]!;
  const photos = input.posts
    .map((post, index) => {
      const slot = template.slots[index % template.slots.length]!;
      return `<figure class="photo" style="left:${slot.x}px;top:${slot.y}px;width:${slot.width}px;height:${slot.height}px;transform:rotate(${slot.rotation}deg) scale(${slot.scale})"><img src="${post.mediaUrl}" /><figcaption>${post.caption ?? ""}</figcaption></figure>`;
    })
    .join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { margin: 0; background: #F6F0E7; color: #342B2A; font-family: Arial, sans-serif; }
    .page { position: relative; width: 390px; height: 844px; padding: 32px; box-sizing: border-box; background: #FFFDF8; overflow: hidden; }
    h1 { margin: 0; font-size: 30px; }
    p { margin: 6px 0 0; color: #8D7F79; }
    .photo { position: absolute; margin: 0; padding: 12px 12px 40px; background: white; box-shadow: 0 12px 24px rgba(52,43,42,.14); }
    .photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
    figcaption { margin-top: 10px; font-size: 13px; color: #8D7F79; }
  </style>
</head>
<body><main class="page"><h1>${input.title}</h1><p>${input.subtitle}</p>${photos}</main></body>
</html>`;
}
