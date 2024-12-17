require('dotenv').config();
const { Bot } = require('grammy');
const puppeteer = require('puppeteer');

// Добавление API-ключа прямо в код
const bot = new Bot(process.env.BOT_API_KEY);

bot.command('start', async (ctx) => {
  await ctx.reply('Привет! Напиши название фильма :)');
});

bot.on('message', async (ctx) => {
  const searchQuery = ctx.message.text.trim();
  
  if (!searchQuery) {
    return ctx.reply('Напиши название фильма или вопрос для поиска.');
  }

  // Запускаем Puppeteer с headless режимом (без UI)
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Переходим на Google и выполняем поиск
    await page.goto('https://www.google.com/search?q=' + encodeURIComponent(searchQuery + ' kinopoisk'));

    // Ожидаем загрузки первых результатов поиска
    await page.waitForSelector('h3 > a'); 

    // Извлекаем ссылку с первого результата
    let firstLink = await page.$eval('h3 > a', (el) => el.href);

    if (firstLink) {
      // Приводим ссылку к нужному формату
      const cleanedLink = firstLink.replace(/(https:\/\/www\.kinopoisk\.ru\/film\/\d+)(\/.*)?/, '$1');

      // Заменяем "kino" на "ss"
      const finalLink = cleanedLink.replace('kino', 'ss');

      // Отправляем пользователю измененную ссылку
      await ctx.reply(`${finalLink}`);
    } else {
      await ctx.reply('Не удалось найти результат.');
    }
  } catch (error) {
    await ctx.reply('Произошла ошибка при поиске.');
    console.error('Error during search:', error);
  } finally {
    // Закрываем браузер независимо от успеха
    await browser.close();
  }
});

bot.start();