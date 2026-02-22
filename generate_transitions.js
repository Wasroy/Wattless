const fs = require('fs');

const servers = JSON.parse(fs.readFileSync('src/data/nerve_servers.json', 'utf8'));
const transitions = JSON.parse(fs.readFileSync('src/data/transitions.json', 'utf8'));

const serverNames = servers.map(s => s.name);

const getCityName = (name) => {
  const parts = name.split(' - ');
  if (parts.length > 1) {
    return parts[1].split(',')[0].trim();
  }
  return name;
};

const weatherReasons = ['5-8°C plus frais', '10-15°C plus frais', '8-12°C plus frais'];
const carbonReasons = ['mix énergétique plus vert', 'énergie renouvelable majoritaire', 'intensité carbone réduite'];
const availabilityReasons = ['risque d\'interruption Spot réduit de 70%', 'disponibilité améliorée de 60%', 'stabilité accrue de 50%'];

let timestamp = 151500;
const newTransitions = [];

for (let i = 0; i < 100; i++) {
  const from = serverNames[Math.floor(Math.random() * serverNames.length)];
  let to;
  do {
    to = serverNames[Math.floor(Math.random() * serverNames.length)];
  } while (to === from);

  const numSources = Math.random() < 0.6 ? 1 : Math.random() < 0.85 ? 2 : 3;
  const selectedSources = [];
  
  if (numSources === 1) {
    selectedSources.push('price');
  } else if (numSources === 2) {
    selectedSources.push('price');
    selectedSources.push(Math.random() < 0.5 ? 'weather' : 'carbon');
  } else {
    selectedSources.push('price', 'weather', 'carbon');
  }

  const financialGains = [];
  let totalUsd = 0;

  selectedSources.forEach((source) => {
    let amountUsd;
    if (source === 'price') {
      amountUsd = Math.random() * 2.5 + 0.15;
    } else if (source === 'weather') {
      amountUsd = Math.random() * 0.5 + 0.1;
    } else if (source === 'carbon') {
      amountUsd = Math.random() * 0.3 + 0.1;
    } else {
      amountUsd = Math.random() * 0.15 + 0.05;
    }

    const amountEur = amountUsd * 0.92;
    totalUsd += amountUsd;

    let reason = '';
    if (source === 'price') {
      reason = `+${amountUsd.toFixed(2)}€ car serveur moins cher trouvé — optimisation Spot pricing intelligente`;
    } else if (source === 'weather') {
      const city = getCityName(to);
      reason = `+${amountUsd.toFixed(2)}€ car meilleure météo (${city}: ${weatherReasons[Math.floor(Math.random() * weatherReasons.length)]}) — refroidissement naturel efficace`;
    } else if (source === 'carbon') {
      const city = getCityName(to);
      reason = `+${amountUsd.toFixed(2)}€ car intensité carbone réduite (${city}: ${carbonReasons[Math.floor(Math.random() * carbonReasons.length)]}) — économie sur compensation carbone`;
    } else {
      const city = getCityName(to);
      reason = `+${amountUsd.toFixed(2)}€ car meilleure disponibilité (${city}: ${availabilityReasons[Math.floor(Math.random() * availabilityReasons.length)]})`;
    }

    financialGains.push({
      amount_usd: parseFloat(amountUsd.toFixed(2)),
      amount_eur: parseFloat(amountEur.toFixed(2)),
      source,
      reason
    });
  });

  const totalEur = totalUsd * 0.92;
  const summaryParts = financialGains.map(g => {
    const sourceName = g.source === 'price' ? 'prix' : 
                      g.source === 'weather' ? 'météo' : 
                      g.source === 'carbon' ? 'carbone' : 'disponibilité';
    return `${g.amount_usd.toFixed(2)}€ ${sourceName}`;
  });
  const summary = `Total: +${totalUsd.toFixed(2)}€ (${summaryParts.join(' + ')})`;

  newTransitions.push({
    from,
    to,
    timestamp,
    savings: parseFloat(totalUsd.toFixed(2)),
    financial_gains: financialGains,
    total_gain_usd: parseFloat(totalUsd.toFixed(2)),
    total_gain_eur: parseFloat(totalEur.toFixed(2)),
    summary
  });

  timestamp += 1500;
}

const allTransitions = [...transitions, ...newTransitions];
fs.writeFileSync('src/data/transitions.json', JSON.stringify(allTransitions, null, 2));

console.log('Added 100 new transitions. Total:', allTransitions.length);
