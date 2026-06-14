import { type Client, PermissionFlagsBits, EmbedBuilder } from "discord.js";
import { logger } from "../../lib/logger";

const MEDIA_ONLY_KEYWORDS = ["media", "clips", "screenshots", "clips-screenshots"];

const BAD_WORDS = [
  "nigger", "nigga", "faggot", "retard", "chink", "spic", "kike", "tranny",
  "cunt", "whore", "slut",
];

const INVITE_REGEX = /(discord\.gg|discord\.com\/invite|discordapp\.com\/invite)\/[a-zA-Z0-9-]+/i;

interface SpamEntry {
  count: number;
  lastMsg: number;
  warned: boolean;
  messageIds: string[];
  channelId: string;
}
const spamTracker = new Map<string, SpamEntry>();

function isMediaOnlyChannel(channelName: string): boolean {
  return MEDIA_ONLY_KEYWORDS.some((kw) => channelName.toLowerCase().includes(kw));
}

function containsBadWord(content: string): string | null {
  const lower = content.toLowerCase();
  for (const word of BAD_WORDS) {
    if (new RegExp(`\\b${word}\\b`, "i").test(lower)) return word;
  }
  return null;
}

async function dmUser(client: Client, userId: string, embed: EmbedBuilder) {
  try {
    const user = await client.users.fetch(userId);
    await user.send({ embeds: [embed] });
  } catch { /* DMs disabled */ }
}

export function registerMessageEvent(client: Client) {
  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (!message.guild) return;

    const channel = message.channel;
    if (!("name" in channel)) return;
    const channelName = (channel as { name: string }).name;

    const member = message.member;
    const isStaff = member?.permissions.has(PermissionFlagsBits.ManageMessages) ?? false;

    // ── MEDIA-ONLY ─────────────────────────────────────────────────────────
    if (isMediaOnlyChannel(channelName)) {
      if (!isStaff) {
        const hasAttachment = message.attachments.size > 0;
        const hasValidEmbed = message.embeds.some((e) => e.image || e.thumbnail || e.video);
        if (!hasAttachment && !hasValidEmbed) {
          try {
            await message.delete();
            await dmUser(client, message.author.id, new EmbedBuilder()
              .setColor(0xff4444)
              .setTitle("❌ Media Only Channel")
              .setDescription(`**#${channelName}** only allows images, videos, and files.\nText-only messages are not allowed here.`)
              .setFooter({ text: "CSF Auto-Mod" }));
          } catch (err) {
            logger.error({ err }, "Failed to enforce media-only channel");
          }
        }
      }
      return;
    }

    if (isStaff) return;

    // ── BAD WORD FILTER ────────────────────────────────────────────────────
    const badWord = containsBadWord(message.content);
    if (badWord) {
      try {
        await message.delete();
        await dmUser(client, message.author.id, new EmbedBuilder()
          .setColor(0xff4444)
          .setTitle("🚫 Message Removed — Inappropriate Language")
          .setDescription(`Your message in **${message.guild.name}** was removed for containing a prohibited word.\n\nPlease follow the server rules. Repeated violations may result in a timeout or ban.`)
          .setFooter({ text: "CSF Auto-Mod" })
          .setTimestamp());
        logger.info({ user: message.author.tag, word: badWord }, "Bad word removed");
      } catch (err) {
        logger.error({ err }, "Failed to remove bad word");
      }
      return;
    }

    // ── INVITE LINK FILTER ─────────────────────────────────────────────────
    if (INVITE_REGEX.test(message.content)) {
      try {
        await message.delete();
        await dmUser(client, message.author.id, new EmbedBuilder()
          .setColor(0xff8800)
          .setTitle("🔗 Invite Link Removed")
          .setDescription(`Your message in **${message.guild.name}** was removed for containing a Discord invite link.\n\nAdvertising other servers without staff approval is not allowed.`)
          .setFooter({ text: "CSF Auto-Mod" })
          .setTimestamp());
        logger.info({ user: message.author.tag }, "Invite link removed");
      } catch (err) {
        logger.error({ err }, "Failed to remove invite link");
      }
      return;
    }

    // ── SPAM DETECTION + PURGE ─────────────────────────────────────────────
    const now = Date.now();
    const entry = spamTracker.get(message.author.id) ?? {
      count: 0, lastMsg: 0, warned: false, messageIds: [], channelId: message.channelId,
    };

    if (now - entry.lastMsg < 4000) {
      entry.count++;
      entry.messageIds.push(message.id);
      if (entry.channelId !== message.channelId) {
        entry.messageIds = [message.id];
        entry.channelId = message.channelId;
      }
    } else {
      entry.count = 1;
      entry.messageIds = [message.id];
      entry.channelId = message.channelId;
    }
    entry.lastMsg = now;
    spamTracker.set(message.author.id, entry);

    if (entry.count >= 5 && !entry.warned) {
      entry.warned = true;
      spamTracker.set(message.author.id, entry);

      // Reset after 10s
      setTimeout(() => {
        const e = spamTracker.get(message.author.id);
        if (e) { e.warned = false; e.count = 0; e.messageIds = []; spamTracker.set(message.author.id, e); }
      }, 10000);

      try {
        // Bulk delete all spam messages from this user in this channel
        const toDelete = [...entry.messageIds];
        const textChannel = message.channel as { bulkDelete?: (ids: string[]) => Promise<unknown> };
        if (textChannel.bulkDelete && toDelete.length > 0) {
          await textChannel.bulkDelete(toDelete).catch(async () => {
            // Fallback: delete one by one
            for (const id of toDelete) {
              await message.channel.messages.fetch(id)
                .then((m) => m.delete())
                .catch(() => {});
            }
          });
        }

        await dmUser(client, message.author.id, new EmbedBuilder()
          .setColor(0xff8800)
          .setTitle("⚠️ Spam Detected — Messages Purged")
          .setDescription(`All your recent spam messages in **${message.guild.name}** have been deleted.\n\nPlease slow down. Continued spamming may result in a timeout.`)
          .setFooter({ text: "CSF Auto-Mod" })
          .setTimestamp());
        logger.info({ user: message.author.tag, deleted: toDelete.length }, "Spam messages purged");
      } catch (err) {
        logger.error({ err }, "Failed to purge spam messages");
      }
      return;
    }

    // ── EXCESSIVE CAPS ─────────────────────────────────────────────────────
    const content = message.content;
    if (content.length > 20) {
      const letters = content.replace(/[^a-zA-Z]/g, "");
      const caps = content.replace(/[^A-Z]/g, "");
      if (letters.length > 0 && caps.length / letters.length > 0.8) {
        try {
          await message.delete();
          await dmUser(client, message.author.id, new EmbedBuilder()
            .setColor(0xffcc00)
            .setTitle("⚠️ Excessive Caps")
            .setDescription(`Your message in **${message.guild.name}** was removed for excessive capitalization.\n\nPlease avoid sending messages in ALL CAPS.`)
            .setFooter({ text: "CSF Auto-Mod" })
            .setTimestamp());
        } catch (err) {
          logger.error({ err }, "Failed to handle caps");
        }
      }
    }
  });
}
