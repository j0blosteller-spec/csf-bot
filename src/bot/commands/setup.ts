import {
  type ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
  ChannelType,
  type CategoryChannel,
  type Guild,
  type OverwriteResolvable,
} from "discord.js";
import { logger } from "../../lib/logger";

export const data = new SlashCommandBuilder()
  .setName("setup")
  .setDescription("Create the CSF channel structure (categories + channels)")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

interface ChannelSpec {
  name: string;
  type: ChannelType.GuildText | ChannelType.GuildAnnouncement;
  readOnly?: boolean;
  mediaOnly?: boolean;
  topic?: string;
}

interface CategorySpec {
  name: string;
  channels: ChannelSpec[];
}

const STRUCTURE: CategorySpec[] = [
  {
    name: "📋 Information",
    channels: [
      {
        name: "📢・announcements",
        type: ChannelType.GuildAnnouncement,
        readOnly: true,
        topic: "Official CSF announcements. Read-only.",
      },
      {
        name: "📜・rules",
        type: ChannelType.GuildText,
        readOnly: true,
        topic: "Server rules. Read-only.",
      },
      {
        name: "ℹ️・info",
        type: ChannelType.GuildText,
        readOnly: true,
        topic: "Server information. Read-only.",
      },
    ],
  },
  {
    name: "💬 General",
    channels: [
      {
        name: "💬・general",
        type: ChannelType.GuildText,
        topic: "General conversation.",
      },
      {
        name: "🖼️・media",
        type: ChannelType.GuildText,
        mediaOnly: true,
        topic: "Share images and files only — no text messages.",
      },
      {
        name: "🔗・links",
        type: ChannelType.GuildText,
        topic: "Share useful links.",
      },
    ],
  },
  {
    name: "🎮 Gaming",
    channels: [
      {
        name: "🎮・gaming-general",
        type: ChannelType.GuildText,
        topic: "Talk about games.",
      },
      {
        name: "📸・clips-screenshots",
        type: ChannelType.GuildText,
        mediaOnly: true,
        topic: "Share your clips and screenshots — images/files only.",
      },
    ],
  },
  {
    name: "🎫 Support",
    channels: [
      {
        name: "🎫・open-a-ticket",
        type: ChannelType.GuildText,
        readOnly: true,
        topic: "Open a support ticket here.",
      },
    ],
  },
];

async function buildOverwrites(
  guild: Guild,
  readOnly: boolean,
  mediaOnly: boolean
): Promise<OverwriteResolvable[]> {
  const overwrites: OverwriteResolvable[] = [];

  if (readOnly) {
    // Fully read-only: no one can send except staff
    overwrites.push({
      id: guild.id,
      deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.CreatePublicThreads],
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
    });
  }

  if (mediaOnly) {
    // Allow sending — the bot enforces media-only by deleting text-only messages
    overwrites.push({
      id: guild.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
      ],
    });
  }

  return overwrites;
}

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const guild = interaction.guild;
  if (!guild) {
    await interaction.editReply("❌ Must be run inside a server.");
    return;
  }

  let created = 0;
  let skipped = 0;
  const log: string[] = [];

  for (const catSpec of STRUCTURE) {
    let category: CategoryChannel;

    const existing = guild.channels.cache.find(
      (c) =>
        c.type === ChannelType.GuildCategory &&
        c.name.toLowerCase() === catSpec.name.toLowerCase()
    ) as CategoryChannel | undefined;

    if (existing) {
      category = existing;
      skipped++;
    } else {
      category = await guild.channels.create({
        name: catSpec.name,
        type: ChannelType.GuildCategory,
      });
      created++;
    }

    for (const chSpec of catSpec.channels) {
      const existingCh = guild.channels.cache.find(
        (c) =>
          c.name === chSpec.name.replace(/[^a-z0-9-・]/gi, "").toLowerCase() ||
          c.name === chSpec.name
      );

      if (existingCh) {
        skipped++;
        continue;
      }

      const overwrites = await buildOverwrites(
        guild,
        chSpec.readOnly ?? false,
        chSpec.mediaOnly ?? false
      );

      await guild.channels.create({
        name: chSpec.name,
        type: chSpec.type,
        parent: category.id,
        topic: chSpec.topic,
        permissionOverwrites: overwrites,
      });

      log.push(`✅ #${chSpec.name}`);
      created++;
    }
  }

  await interaction.editReply(
    `**CSF Channel Setup Complete!**\n\n` +
      `Created: **${created}** • Skipped (already exists): **${skipped}**\n\n` +
      (log.length ? log.join("\n") : "No new channels created.")
  );

  logger.info({ created, skipped }, "Setup command complete");
}
