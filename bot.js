const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: "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",
});
const openai = new OpenAIApi(configuration);
const fs = require("fs");

const mineflayer = require("mineflayer");

const vec3 = require("vec3");

const mineflayerViewer = require("prismarine-viewer").mineflayer;

const { GoalNear } = require("mineflayer-pathfinder").goals;
const { GoalXZ } = require('mineflayer-pathfinder').goals
const { pathfinder, Movements } = require('mineflayer-pathfinder')
const navigatePlugin = require("mineflayer-navigate")(mineflayer);

const toolPlugin = require("mineflayer-tool").plugin;

const $file = "/opt/MineAI/commands.txt";

let bot = mineflayer.createBot({
  host: "lafouffe.fr", // minecraft server ip
  username: "Bot", // minecraft username
  port: 25575, // only set if you need a port that isn't 25565
});

var stdin = process.openStdin();

//wait text console
stdin.addListener("data", async function (message) {
  await openaifunction(message);
});

//initialize plugin
navigatePlugin(bot);
bot.loadPlugin(toolPlugin);
bot.loadPlugin(pathfinder);
const mcData = require("minecraft-data")("1.18.2");

//view bot in web browser
bot.once("spawn", () => {
  mineflayerViewer(bot, { port: 3008, firstPerson: true });

  const path = [bot.entity.position.clone()]
  bot.on('move', () => {
    if (path[path.length - 1].distanceTo(bot.entity.position) > 1) {
      path.push(bot.entity.position.clone())
      bot.viewer.drawLine('path', path)
    }
  })

  const defaultMove = new Movements(bot, mcData)
  bot.pathfinder.setMovements(defaultMove)
  bot.pathfinder.setGoal(new GoalXZ(1000, 0))


  const name = "stone";
  const ids = [mcData.blocksByName[name].id];
  const blocks = bot.findBlocks({ matching: ids, maxDistance: 128, count: 10 });

});

//dig function
async function digBlock(name) {
  const ids = [mcData.blocksByName[name].id];
  var blocks = bot.findBlock({ matching: ids, maxDistance: 128, count: 10 });
  const { x: blockX, y: blockY, z: blockZ } = blocks.position;
  await bot.pathfinder.setGoal(new GoalNear(blockX, blockY, blockZ, 1));
  target = bot.blockAt(blocks.position.offset(0, 0, 0));
  bot.dig(target);
}

//wait text send to chat
bot.on("chat", async (username, message) => {
  if (username === bot.username || message.startsWith("/")) return;
  await openaifunction(message);
});

//return text to openai
async function openaifunction(message) {
  const prompt = fs.readFileSync($file, "utf8") + "//" + message + "\n";
  const response = await openai.createCompletion("text-davinci-002", {
    prompt: prompt,
    temperature: 0,
    max_tokens: 128,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    stop: ["//"],
  });
  try {
    await eval(response.data.choices[0].text);
    console.log("GOOD");
    console.log(response.data.choices[0].text);
  } catch {
    bot.chat(response.data.choices[0].text);
    console.log("PAS GOOD");
    console.log(response.data.choices[0].text);
  }
}
