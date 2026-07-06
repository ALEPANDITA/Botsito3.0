import db from '#db';

export default {
  command: ['casino', 'apostar', 'bet'],
  category: 'economy',
  description: 'Apostar coins a un color en el casino.',
  run: async ({ msg, sock, args, usedPrefix, command }) => {
    const chatData = db.getChat(msg.chat);
    if (chatData.adminonly || !chatData.economy) {
      return msg.reply(`ꕥ Los comandos de *Economía* están desactivados en este grupo.\n\nUn *administrador* puede activarlos con el comando:\n» *${usedPrefix}economy on*`);
    }

    const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
    const bot = db.getSettings(botId);
    const currency = bot.currency;
    const botname = bot.botname;

    db.setCreate('chat_users', [msg.chat, msg.sender], 'lastCasino', 0);
    const user = db.getChatUser(msg.chat, msg.sender);
    const userName = (db.getUser(msg.sender)?.name) || msg.sender.split('@')[0];

    const tiempoEspera = 30 * 1000;
    const ahora = Date.now();
    if (user.lastCasino && ahora - user.lastCasino < tiempoEspera) {
      const restante = user.lastCasino + tiempoEspera - ahora;
      const tiempoRestante = formatTime(restante);
      return sock.reply(msg.chat, `ꕥ Debes esperar *${tiempoRestante}* para usar *${usedPrefix + command}* nuevamente.`, msg);
    }

    const colores = ['red', 'blue', 'black'];
    const emojis = { red: '🔴', blue: '🔵', black: '⚫' };

    const color = args[0] ? args[0].toLowerCase() : null;
    const count = args[1] ? parseInt(args[1]) : NaN;

    if (!color || !colores.includes(color) || !args[1] || isNaN(count) || count <= 0) {
      return sock.reply(msg.chat, `❀ *${botname} CASINO*\n\n🎯 Apuesta a un color:\n🔴 Red = x2\n🔵 Blue = x3\n⚫ Black = x5\n\n> Ejemplo: *${usedPrefix + command} red 100*`, msg);
    }

    if (user.coins < count) {
      return sock.reply(msg.chat, `ꕥ No tienes *¥${formatNumber(count)} ${currency}* para apostar!`, msg);
    }

    db.setChatUser(msg.chat, msg.sender, 'lastCasino', ahora);

    const resultado = colores[Math.floor(Math.random() * colores.length)];
    const gano = resultado === color;
    const multiplicador = color === 'red' ? 2 : color === 'blue' ? 3 : 5;
    const ganancia = gano ? count * multiplicador : 0;

    const nuevoSaldo = (user.coins - count) + ganancia;
    db.setChatUser(msg.chat, msg.sender, 'coins', nuevoSaldo);

    let texto = `❀ *${userName}*, apostaste *¥${formatNumber(count)} ${currency}* a ${emojis[color]} *${color.toUpperCase()}* (x${multiplicador})\n\n`;
    texto += `🎲 Salió: ${emojis[resultado]} *${resultado.toUpperCase()}*\n\n`;

    if (gano) {
      texto += `🏆 *¡Ganaste ¥${formatNumber(ganancia)} ${currency}!*\n`;
    } else {
      texto += `💀 *Perdiste ¥${formatNumber(count)} ${currency}*\n`;
    }
    texto += `➠ Total: *¥${formatNumber(nuevoSaldo)} ${currency}*`;

    let { key } = await sock.sendMessage(msg.chat, { text: "🎲 La ruleta gira... ¡Las apuestas están cerradas!" }, { quoted: msg });
    await delay(2000);
    await sock.sendMessage(msg.chat, { text: texto.trim(), edit: key }, { quoted: msg });
  }
};

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatNumber(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatTime(ms) {
  if (ms <= 0 || isNaN(ms)) return 'Ahora';
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const partes = [];
  if (min) partes.push(`${min} minuto${min !== 1 ? 's' : ''}`);
  partes.push(`${sec} segundo${sec !== 1 ? 's' : ''}`);
  return partes.join(' ');
}
