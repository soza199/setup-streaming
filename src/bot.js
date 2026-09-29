import {
  ActionRowBuilder,
  ActivityType,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  MessageFlags,
  ModalBuilder,
  PermissionsBitField,
  REST,
  Routes,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDirectory = path.join(__dirname, "..", "data");
const configPath = path.join(dataDirectory, "streaming-config.json");
const attachedConfigPath = path.join(__dirname, "..", "attached_assets", "my-streaming-config_1790640294658.json");
const botToken = process.env.DISCORD_BOT_TOKEN;

if (!botToken) {
  console.error("Missing DISCORD_BOT_TOKEN. Add it as a Replit Secret before starting the bot.");
  process.exit(1);
}

const defaultConfig = {
  format: "lemon-streaming-config",
  version: 1,
  streamStartTime: "",
  streamDuration: "",
  streamStartDuration: "",
  streamParty: "",
  delayTime: "10s",
  pages: [
    {
      line1: "soza",
      line2: "",
      line3: "",
      largeImage: "",
      smallImage: "",
      streamName: "Twitch",
      streamUrl: "https://twitch.tv/discord",
      streamType: "STREAMING",
      buttons: { button1Name: "", button1Link: "", button2Name: "", button2Link: "" },
    },
    {
      line1: "",
      line2: "",
      line3: "",
      largeImage: "",
      smallImage: "",
      streamName: "Twitch",
      streamUrl: "https://twitch.tv/discord",
      streamType: "STREAMING",
      buttons: { button1Name: "", button1Link: "", button2Name: "", button2Link: "" },
    },
  ],
};

let config = loadConfig();
let enabled = true;
let streamingToken = "";
let panelLocation = null;

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const commands = [
  new SlashCommandBuilder()
    .setName("streaming")
    .setDescription("Buka panel kontrol status streaming Lemon Cloudy")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild.toString())
    .toJSON(),
];

function loadConfig() {
  fs.mkdirSync(dataDirectory, { recursive: true });
  if (!fs.existsSync(configPath)) {
    const seedPath = fs.existsSync(attachedConfigPath) ? attachedConfigPath : null;
    const seed = seedPath ? JSON.parse(fs.readFileSync(seedPath, "utf8")) : defaultConfig;
    const normalized = normalizeConfig(seed);
    fs.writeFileSync(configPath, JSON.stringify(normalized, null, 2));
    return normalized;
  }
  try {
    const stored = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return normalizeConfig(stored);
  } catch (error) {
    console.error("Config file was invalid, restoring defaults:", error.message);
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
    return structuredClone(defaultConfig);
  }
}

function normalizeConfig(value) {
  const pages = Array.isArray(value.pages) ? value.pages : defaultConfig.pages;
  return {
    ...structuredClone(defaultConfig),
    ...value,
    pages: [0, 1].map((index) => ({
      ...structuredClone(defaultConfig.pages[index]),
      ...(pages[index] || {}),
      buttons: {
        ...structuredClone(defaultConfig.pages[index].buttons),
        ...(pages[index]?.buttons || {}),
      },
    })),
  };
}

function saveConfig() {
  fs.mkdirSync(dataDirectory, { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function updatePresence() {
  if (!client.user) return;
  const page = config.pages[0];
  const streamUrl = /^https?:\/\//i.test(page.streamUrl || "") ? page.streamUrl : undefined;
  client.user.setPresence({
    status: enabled ? "online" : "idle",
    activities: enabled && page.line1
      ? [{ name: page.line1, type: ActivityType.Streaming, url: streamUrl }]
      : [],
  });
}

function input(customId, label, value = "", placeholder = "", style = TextInputStyle.Short) {
  const builder = new TextInputBuilder()
    .setCustomId(customId)
    .setLabel(label.slice(0, 45))
    .setStyle(style)
    .setRequired(false);
  if (value) builder.setValue(String(value).slice(0, style === TextInputStyle.Paragraph ? 4000 : 100));
  if (placeholder) builder.setPlaceholder(placeholder.slice(0, 100));
  return builder;
}

function modalRow(field) {
  return new ActionRowBuilder().addComponents(field);
}

function pageModal(index) {
  const page = config.pages[index];
  return new ModalBuilder()
    .setCustomId(`modal_page_${index}`)
    .setTitle(`SET PAGE ${index + 1}`)
    .addComponents(
      modalRow(input("line1", "Teks baris satu", page.line1, "soza")),
      modalRow(input("line2", "Teks baris dua", page.line2, "Teks baris kedua")),
      modalRow(input("line3", "Teks baris tiga", page.line3, "Teks baris ketiga")),
      modalRow(input("largeImage", "URL gambar besar", page.largeImage, "https://example.com/banner.jpg")),
      modalRow(input("smallImage", "URL gambar kecil", page.smallImage, "https://example.com/icon.jpg")),
    );
}

function buttonModal() {
  const buttons = config.pages[0].buttons;
  return new ModalBuilder()
    .setCustomId("modal_button")
    .setTitle("SET BUTTON")
    .addComponents(
      modalRow(input("button1Name", "Nama tombol satu", buttons.button1Name, "Klik di sini")),
      modalRow(input("button1Link", "URL tombol satu", buttons.button1Link, "https://example.com")),
      modalRow(input("button2Name", "Nama tombol dua", buttons.button2Name, "Lihat lebih lanjut")),
      modalRow(input("button2Link", "URL tombol dua", buttons.button2Link, "https://example.com")),
    );
}

function linkModal() {
  const page = config.pages[0];
  return new ModalBuilder()
    .setCustomId("modal_link")
    .setTitle("SET LINK")
    .addComponents(
      modalRow(input("streamName", "Nama stream", page.streamName, "Twitch")),
      modalRow(input("streamUrl", "URL link stream", page.streamUrl, "https://twitch.tv/discord")),
      modalRow(input("streamType", "Jenis status", page.streamType, "STREAMING")),
      modalRow(input("streamStartTime", "Waktu mulai status", config.streamStartTime, "30m, 2h, 1h30m")),
      modalRow(input("delayTime", "Jeda antar halaman", config.delayTime, "10s")),
    );
}

function progressModal() {
  return new ModalBuilder()
    .setCustomId("modal_progress")
    .setTitle("SET PROGRESS")
    .addComponents(
      modalRow(input("streamStartTime", "Waktu mulai streaming", config.streamStartTime, "2026-09-28 22:30")),
      modalRow(input("streamDuration", "Durasi streaming", config.streamDuration, "2h 30m")),
      modalRow(input("streamStartDuration", "Durasi awal status", config.streamStartDuration, "30m")),
    );
}

function tokenModal() {
  return new ModalBuilder()
    .setCustomId("modal_token")
    .setTitle("SET TOKEN")
    .addComponents(
      modalRow(input("streamingToken", "Streaming token", streamingToken, "Masukkan token status", TextInputStyle.Paragraph)),
    );
}

function panelEmbed() {
  const page = config.pages[0];
  const copy = [page.line1, page.line2, page.line3].filter(Boolean).join("\n") || "Belum ada status yang diatur.";
  const embed = new EmbedBuilder()
    .setColor(enabled ? 0xb000ff : 0x555866)
    .setTitle("Lemon Cloudy")
    .setDescription(`**${copy}**\n\n${enabled ? "🟢 Status streaming aktif" : "⚫ Status streaming nonaktif"}`)
    .addFields(
      { name: "🌐 Stream", value: page.streamName || "Belum diatur", inline: true },
      { name: "📡 Type", value: page.streamType || "STREAMING", inline: true },
      { name: "⏱️ Delay", value: config.delayTime || "10s", inline: true },
    )
    .setFooter({ text: "Lemon Cloudy • Streaming Control" })
    .setTimestamp();

  if (page.largeImage && /^https?:\/\//i.test(page.largeImage)) embed.setImage(page.largeImage);
  if (page.smallImage && /^https?:\/\//i.test(page.smallImage)) embed.setThumbnail(page.smallImage);
  return embed;
}

function controlButton(customId, label, style, emoji) {
  return new ButtonBuilder().setCustomId(customId).setLabel(label).setStyle(style).setEmoji(emoji);
}

function panelComponents() {
  return [
    new ActionRowBuilder().addComponents(
      controlButton("reset", "RESET STREAMING DATA", ButtonStyle.Secondary, "🔄"),
      controlButton("set_token", "SET TOKEN", ButtonStyle.Primary, "🔑"),
    ),
    new ActionRowBuilder().addComponents(
      controlButton("set_page_0", "SET PAGE 1", ButtonStyle.Secondary, "📄"),
      controlButton("set_page_1", "SET PAGE 2", ButtonStyle.Secondary, "📄"),
    ),
    new ActionRowBuilder().addComponents(
      controlButton("set_button", "SET BUTTON", ButtonStyle.Secondary, "🔘"),
      controlButton("set_link", "SET LINK", ButtonStyle.Secondary, "🔗"),
    ),
    new ActionRowBuilder().addComponents(
      controlButton("set_progress", "SET PROGRESS", ButtonStyle.Secondary, "⏱️"),
      controlButton("enable", "ENABLE", ButtonStyle.Success, "📡").setDisabled(enabled),
      controlButton("disable", "DISABLE", ButtonStyle.Danger, "⛔").setDisabled(!enabled),
    ),
    new ActionRowBuilder().addComponents(
      controlButton("raw_json", "RAW JSON", ButtonStyle.Secondary, "⚙️"),
    ),
  ];
}

function isAuthorized(interaction) {
  return (
    !interaction.inGuild() ||
    interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageGuild)
  );
}

async function refreshPanel() {
  if (!panelLocation) return;
  try {
    const channel = await client.channels.fetch(panelLocation.channelId);
    const message = await channel.messages.fetch(panelLocation.messageId);
    await message.edit({ embeds: [panelEmbed()], components: panelComponents() });
  } catch (error) {
    console.warn("Could not refresh the previous panel:", error.message);
    panelLocation = null;
  }
}

async function rejectUnauthorized(interaction) {
  await interaction.reply({
    content: "Kamu memerlukan izin **Manage Server** untuk menggunakan panel ini.",
    flags: MessageFlags.Ephemeral,
  });
}

client.once("clientReady", async (readyClient) => {
  const rest = new REST({ version: "10" }).setToken(botToken);
  const guildId = process.env.DISCORD_GUILD_ID;
  const route = guildId
    ? Routes.applicationGuildCommands(readyClient.application.id, guildId)
    : Routes.applicationCommands(readyClient.application.id);
  await rest.put(route, { body: commands });
  updatePresence();
  console.log(`Lemon Cloudy is online as ${readyClient.user.tag}`);
  console.log(guildId ? `Slash command registered in guild ${guildId}` : "Global slash command registered; Discord may take a moment to propagate it.");
});

client.on("interactionCreate", async (interaction) => {
  try {
    if (!isAuthorized(interaction)) {
      await rejectUnauthorized(interaction);
      return;
    }

    if (interaction.isChatInputCommand() && interaction.commandName === "streaming") {
      await interaction.reply({
        content: "Panel kontrol status streaming:",
        embeds: [panelEmbed()],
        components: panelComponents(),
      });
      const reply = await interaction.fetchReply();
      panelLocation = { channelId: reply.channelId, messageId: reply.id };
      return;
    }

    if (interaction.isButton()) {
      if (interaction.customId === "set_page_0") return interaction.showModal(pageModal(0));
      if (interaction.customId === "set_page_1") return interaction.showModal(pageModal(1));
      if (interaction.customId === "set_button") return interaction.showModal(buttonModal());
      if (interaction.customId === "set_link") return interaction.showModal(linkModal());
      if (interaction.customId === "set_progress") return interaction.showModal(progressModal());
      if (interaction.customId === "set_token") return interaction.showModal(tokenModal());

      if (interaction.customId === "raw_json") {
        const attachment = new AttachmentBuilder(Buffer.from(JSON.stringify(config, null, 2)), {
          name: "my-streaming-config.json",
        });
        await interaction.reply({
          content: "Ini konfigurasi streaming kamu saat ini.",
          files: [attachment],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      if (interaction.customId === "reset") {
        config = structuredClone(defaultConfig);
        saveConfig();
        updatePresence();
        await interaction.update({ content: "Panel kontrol status streaming:", embeds: [panelEmbed()], components: panelComponents() });
        return;
      }

      if (interaction.customId === "enable" || interaction.customId === "disable") {
        enabled = interaction.customId === "enable";
        updatePresence();
        await interaction.update({ content: "Panel kontrol status streaming:", embeds: [panelEmbed()], components: panelComponents() });
        return;
      }
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith("modal_page_")) {
        const index = Number(interaction.customId.at(-1));
        config.pages[index] = {
          ...config.pages[index],
          line1: interaction.fields.getTextInputValue("line1"),
          line2: interaction.fields.getTextInputValue("line2"),
          line3: interaction.fields.getTextInputValue("line3"),
          largeImage: interaction.fields.getTextInputValue("largeImage"),
          smallImage: interaction.fields.getTextInputValue("smallImage"),
        };
        saveConfig();
        updatePresence();
        await interaction.reply({ content: `SET PAGE ${index + 1} tersimpan.`, flags: MessageFlags.Ephemeral });
        await refreshPanel();
        return;
      }

      if (interaction.customId === "modal_button") {
        config.pages[0].buttons = {
          button1Name: interaction.fields.getTextInputValue("button1Name"),
          button1Link: interaction.fields.getTextInputValue("button1Link"),
          button2Name: interaction.fields.getTextInputValue("button2Name"),
          button2Link: interaction.fields.getTextInputValue("button2Link"),
        };
        saveConfig();
        await interaction.reply({ content: "Button status berhasil disimpan.", flags: MessageFlags.Ephemeral });
        await refreshPanel();
        return;
      }

      if (interaction.customId === "modal_link") {
        config.pages[0].streamName = interaction.fields.getTextInputValue("streamName");
        config.pages[0].streamUrl = interaction.fields.getTextInputValue("streamUrl");
        config.pages[0].streamType = interaction.fields.getTextInputValue("streamType") || "STREAMING";
        config.streamStartTime = interaction.fields.getTextInputValue("streamStartTime");
        config.delayTime = interaction.fields.getTextInputValue("delayTime") || "10s";
        saveConfig();
        updatePresence();
        await interaction.reply({ content: "Link streaming berhasil disimpan.", flags: MessageFlags.Ephemeral });
        await refreshPanel();
        return;
      }

      if (interaction.customId === "modal_progress") {
        config.streamStartTime = interaction.fields.getTextInputValue("streamStartTime");
        config.streamDuration = interaction.fields.getTextInputValue("streamDuration");
        config.streamStartDuration = interaction.fields.getTextInputValue("streamStartDuration");
        saveConfig();
        await interaction.reply({ content: "Progress streaming berhasil disimpan.", flags: MessageFlags.Ephemeral });
        await refreshPanel();
        return;
      }

      if (interaction.customId === "modal_token") {
        streamingToken = interaction.fields.getTextInputValue("streamingToken");
        await interaction.reply({ content: "Streaming token diterima dan hanya disimpan di memori bot.", flags: MessageFlags.Ephemeral });
      }
    }
  } catch (error) {
    console.error("Interaction error:", error);
    const response = { content: "Terjadi error saat memproses aksi. Coba lagi.", flags: MessageFlags.Ephemeral };
    if (interaction.replied || interaction.deferred) await interaction.followUp(response);
    else await interaction.reply(response);
  }
});

process.on("SIGINT", () => client.destroy());
process.on("SIGTERM", () => client.destroy());
client.login(botToken);