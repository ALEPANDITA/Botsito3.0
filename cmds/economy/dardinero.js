import db from '#db';

export default {
  command: ['dardinero', 'dardiamantes', 'addcoins'],
  category: 'owner',
  description: 'Dar o quitar coins a un usuario (solo owner).',
  isOwner: true,
  run: async ({ msg, sock, args, usedPrefix, command }) => {
    const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
    const bot = db.getSettings(botId);
    const currency = bot.currency;

    const mentioned = msg.mentionedJid && msg.mentionedJid[0];
    const quoted = msg.quoted && msg.quoted.sender;
    const target = mentioned || quoted || msg.sender;

    // Si se mencionó/citó a alguien, la cantidad es args[1]; si no, args[0]
    const amountArg = (mentioned || quoted) ? args[1] : args[0];
    const amount = parseInt(amountArg);

    if (isNaN(amount) || amount === 0) {
      return sock.reply(msg.chat, `❀ Cantidad inválida.\n\n> Uso correcto:\n» *${usedPrefix + command} 100*\n» *${usedPrefix + command} @usuario 100*\n» *${usedPrefix + command} @usuario -100* (para quitar)`, msg);
    }

    db.setCreate('chat_users', [msg.chat, target], 'coins', 0);
    const user = db.getChatUser(msg.chat, target);

    const nuevoSaldo = Math.max(0, user.coins + amount);
    db.setChatUser(msg.chat, target, 'coins', nuevoSaldo);

    const targetName = (db.getUser(target)?.name) || target.split('@')[0];
    const accion = amount > 0 ? 'Agregado' : 'Quitado';

    await sock.sendMessage(msg.chat, {
      text: `❀ *Coins actualizados*\n\n➠ Usuario: @${targetName}\n➠ ${accion}: ${formatNumber(Math.abs(amount))} ${currency}\n➠ Total: ${formatNumber(nuevoSaldo)} ${currency}`,
      mentions: [target]
    }, { quoted: msg });
  }
};

function formatNumber(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
