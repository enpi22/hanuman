import "dotenv/config";
import express from "express";
import {
  InteractionType,
  InteractionResponseType,
  InteractionResponseFlags,
  MessageComponentTypes,
  ButtonStyleTypes,
} from "discord-interactions";
import {
  VerifyDiscordRequest,
  getRandomEmoji,
  DiscordRequest,
} from "./utils.js";
import { getShuffledOptions, getResult } from "./game.js";

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// Parse request body and verifies incoming requests using discord-interactions package
app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY) }));

// Store for in-progress games. In production, you'd want to use a DB
const activeGames = {};

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 */
app.post("/interactions", async function (req, res) {
  // Interaction type and data
  const { type, id, data } = req.body;

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;

    // "test" command
    if (name === "hanuman") {
      // Send a message into the channel where command was triggered from
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: Array(10).fill("hanuman").join(" \n"),
        },
      });
    }
    if (name === "hanuman_chalisa") {
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content:
            "Jai Hanuman Gyan Gun Sagar,\nJai Kapis Tihun Lok Ujagar.\nRamdoot Atulit Bal Dhama,\nAnjani Putra Pavan Sut Naama.\nMahaveer Vikram Bajrangi,\nKumati Nivaar Sumati Ke Sangi.\nKanchan Varan Viraj Subesa,\nKanan Kundal Kunchit Kesa.\nHath Bajra Aur Dhvaja Biraje,\nKandhe Moonj Janeu Saaje.\nShankar Suvan Kesari Nandan,\nTej Pratap Maha Jag Vandan.\nVidyavaan Guni Ati Chatur,\nRam Kaaj Karibe Ko Atur.\nPrabhu Charitra Sunibe Ko Rasiya,\nRam Lakhan Sita Man Basiya.\nSukshma Roop Dhari Siyahi Dikhava,\nVikat Roop Dhari Lanka Jarava.\nBhima Roop Dhari Asur Sanhare,\nRamchandra Ke Kaaj Samvare.\nLaye Sanjivan Lakhan Jiyaye,\nShri Raghuvir Harash Uraye.\nRaghupati Kinhi Bahut Badaai,\nTum Mama Priya Bharat Sam Bhai.\nSahas Badan Tumharo Yash Gaave,\nUskahi Shripati Kanth Lagave.\nSanakadik Brahmadi Muneesa,\nNarad Sarad Sahit Ahesaa.\nJam Kuber Digpal Jahan Te,\nKavi Kovid Kahi Sake Kahan Te.\nTum Upkar Sugreevahin Keenha,\nRam Milaye Raj Pad Dinha.\nTumharo Mantra Vibhishan Maana,\nLankeshwar Bhaye Sab Jag Jana.\nYug Sahasra Yojan Par Bhanu,\nLilyo Taahi Madhur Phal Janu.\nPrabhu Mudrika Meli Mukh Maahi,\nJaldhi Langhi Gaye Achraj Naahi.\nDurgam Kaaj Jagat Ke Jete,\nSugam Anugrah Tumhre Tete.\nRam Duware Tum Rakhvare,\nHoat Na Aagya Binu Paisare.\nSab Sukh Lahaye Tumhari Sarna,\nTum Rakshak Kaahu Ko Darna.\nAapan Tej Samharo Aapai,\nTeeno Lok Haank Te Kaapai.\nBhootPisaach Nikat Nahi Aavai,\nMahavir Jab Naam Sunavai.\nNase Rog Hare Sab Peera,\nJapat Niranter Hanumat Beera.\nSankat Te Hanuman Chhudavai,\nMan Kram Vachan Dhyan Jo Lave.\nSab Par Ram Tapasvee Raja,\nTin Ke Kaaj Sakal Tum Saaja.\nAur Manorath Jo Koi Laavai,\nSohi Amit Jivan Phal Paavai.\nCharo Yug Partap Tumhara,\nHai Parsiddha Jagat Ujiyara.\nSadhu Sant Ke Tum Rakhvare,\nAsur Nikandan Ram Dulhare.\nAshta Siddhi Nav Nidhi Ke Data,\nAsa Bar Din Janki Mata.\nRam Rasayan Tumhare Paasa,\nSadaa Raho Raghupati Ke Daasa.\nTumhare Bhajan Ram Ko Bhaavai,\nJanam Janam Ke Dukh Bisraavai.",
        },
      });
    }
    if (name === "hanuman_picture") {
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "",
          embeds: [
            {
              title: "All Hail Hanuman!!",
              image: {
                url: "https://upload.wikimedia.org/wikipedia/commons/3/3a/Ravivarmapress.jpg",
              },
            },
          ],
        },
      });
    }
    if (name === "challenge" && id) {
      const userId = req.body.member.user.id;
      const objectName = req.body.data.options[0].value;
      activeGames[id] = {
        id: userId,
        objectName,
      };
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `A challenge from <@${userId}>`,
          components: [
            {
              type: MessageComponentTypes.ACTION_ROW,
              components: [
                {
                  type: MessageComponentTypes.BUTTON,
                  // Append the game ID to use later on
                  custom_id: `accept_button_${req.body.id}`,
                  label: "Accept",
                  style: ButtonStyleTypes.PRIMARY,
                },
              ],
            },
          ],
        },
      });
    }
  }
  if (type === InteractionType.MESSAGE_COMPONENT) {
    // custom_id set in payload when sending message component
    const componentId = data.custom_id;

    if (componentId.startsWith("accept_button_")) {
      // get the associated game ID
      const gameId = componentId.replace("accept_button_", "");
      // Delete message with token in request body
      const endpoint = `webhooks/${process.env.APP_ID}/${req.body.token}/messages/${req.body.message.id}`;
      try {
        await res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: "What is your object of choice?",
            // Indicates it'll be an ephemeral message
            flags: InteractionResponseFlags.EPHEMERAL,
            components: [
              {
                type: MessageComponentTypes.ACTION_ROW,
                components: [
                  {
                    type: MessageComponentTypes.STRING_SELECT,
                    // Append game ID
                    custom_id: `select_choice_${gameId}`,
                    options: getShuffledOptions(),
                  },
                ],
              },
            ],
          },
        });
        // Delete previous message
        await DiscordRequest(endpoint, { method: "DELETE" });
      } catch (err) {
        console.error("Error sending message:", err);
      }
    } else if (componentId.startsWith("select_choice_")) {
      // get the associated game ID
      const gameId = componentId.replace("select_choice_", "");

      if (activeGames[gameId]) {
        // Get user ID and object choice for responding user
        const userId = req.body.member.user.id;
        const objectName = data.values[0];
        // Calculate result from helper function
        const resultStr = getResult(activeGames[gameId], {
          id: userId,
          objectName,
        });

        delete activeGames[gameId];
        const endpoint = `webhooks/${process.env.APP_ID}/${req.body.token}/messages/${req.body.message.id}`;

        try {
          // Send results
          await res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: resultStr },
          });
          // Update ephemeral message
          await DiscordRequest(endpoint, {
            method: "PATCH",
            body: {
              content: "Nice choice " + getRandomEmoji(),
              components: [],
            },
          });
        } catch (err) {
          console.error("Error sending message:", err);
        }
      }
    }
  }
});

app.listen(PORT, () => {
  console.log("Listening on port", PORT);
});
