import {
  type ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
  EmbedBuilder,
  AttachmentBuilder,
  type TextChannel,
} from "discord.js";
import { logger } from "../../lib/logger";

export const data = new SlashCommandBuilder()
  .setName("announce")
  .setDescription("Send a styled CSF announcement embed")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addStringOption((opt) =>
    opt.setName("title").setDescription("Announcement title").setRequired(true)
  )
  .addStringOption((opt) =>
    opt.setName("message").setDescription("Announcement body").setRequired(true)
  )
  .addChannelOption((opt) =>
    opt.setName("channel").setDescription("Channel to post in (defaults to current)").setRequired(false)
  )
  .addStringOption((opt) =>
    opt.setName("ping").setDescription("Who to ping? e.g. @everyone or @here").setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const title = interaction.options.getString("title", true);
  const body = interaction.options.getString("message", true);
  const channelOption = interaction.options.getChannel("channel");
  const ping = interaction.options.getString("ping") ?? "";

  const target = (channelOption ?? interaction.channel) as TextChannel;

  if (!target || !("send" in target)) {
    await interaction.editReply("❌ Invalid channel.");
    return;
  }

  const logo = new AttachmentBuilder(`${__dirname}/csf-logo.png`, { name: "csf-logo.png" });

  const embed = new EmbedBuilder()
    .setColor(0x00bfff)
    .setAuthor({
      name: "Classic Sword Fight",
      iconURL: "attachment://csf-logo.png",
    })
    .setTitle(`📢 ${title}`)
    .setDescription(body)
    .setThumbnail("attachment://csf-logo.png")
    .setFooter({
      text: `Announced by ${interaction.user.username} • CSF`,
      iconURL: interaction.user.displayAvatarURL(),
    })
    .setTimestamp();

  await target.send({
    content: ping || undefined,
    embeds: [embed],
    files: [logo],
  });

  await interaction.editReply(`✅ Announcement posted in <#${target.id}>!`);
  logger.info({ channel: target.name, title }, "Announcement sent");
}
