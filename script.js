function prefixFromHostCount(hosts) {
  const needed = hosts + 2;
  const bits = Math.ceil(Math.log2(needed));
  return 32 - bits;
}

function ipToInt(ip) {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

function intToIp(int) {
  return [(int >>> 24) & 0xFF, (int >>> 16) & 0xFF, (int >>> 8) & 0xFF, int & 0xFF].join('.');
}

function calculateCIDR(networkCidr, subnetCount) {
  const [network, prefixStr] = networkCidr.split('/');
  let prefix = parseInt(prefixStr, 10);
  if (isNaN(prefix) || prefix < 0 || prefix > 32) throw new Error('CIDR không hợp lệ');
  const extraBits = Math.ceil(Math.log2(subnetCount));
  const newPrefix = prefix + extraBits;
  if (newPrefix > 32) throw new Error('Không thể chia thành số subnet đó với mạng gốc');
  const subnetSize = 2 ** (32 - newPrefix);
  const baseInt = ipToInt(network) & (~0 << (32 - prefix)) >>> 0;
  const results = [];
  for (let i = 0; i < (1 << extraBits); i++) {
    const subnetNetworkInt = (baseInt + i * subnetSize) >>> 0;
    const broadcast = (subnetNetworkInt + subnetSize - 1) >>> 0;
    const hostMin = subnetNetworkInt + 1;
    const hostMax = broadcast - 1;
    results.push({
      subnet: i + 1,
      network: intToIp(subnetNetworkInt),
      broadcast: intToIp(broadcast),
      hostMin: intToIp(hostMin),
      hostMax: intToIp(hostMax),
      mask: '/' + newPrefix
    });
    if (results.length >= subnetCount) break;
  }
  return results;
}

function calculateVLSM(networkCidr, hostList) {
  const [network, prefixStr] = networkCidr.split('/');
  let prefix = parseInt(prefixStr, 10);
  if (isNaN(prefix) || prefix < 0 || prefix > 32) throw new Error('CIDR không hợp lệ');
  const baseInt = ipToInt(network) & (~0 << (32 - prefix)) >>> 0;
  const sorted = hostList.map(h => parseInt(h,10)).filter(n => !isNaN(n) && n > 0).sort((a,b)=>b-a);
  let currentBase = baseInt;
  const results = [];
  for (let i = 0; i < sorted.length; i++) {
    const hosts = sorted[i];
    const neededPrefix = prefixFromHostCount(hosts);
    const subnetSize = 2 ** (32 - neededPrefix);
    if (currentBase % subnetSize !== 0) {
      currentBase = ((Math.floor(currentBase / subnetSize) + 1) * subnetSize) >>> 0;
    }
    const networkInt = currentBase;
    const broadcast = (networkInt + subnetSize -1) >>> 0;
    const hostMin = networkInt +1;
    const hostMax = broadcast -1;
    results.push({
      subnet: i +1,
      requiredHosts: hosts,
      network: intToIp(networkInt),
      broadcast: intToIp(broadcast),
      hostMin: intToIp(hostMin),
      hostMax: intToIp(hostMax),
      mask: '/' + neededPrefix
    });
    currentBase = (broadcast +1) >>> 0;
  }
  return results;
}

function buildTable(rows, mode) {
  let html = '<table><thead><tr>';
  if (mode === 'vlsm') {
    html += '<th>Subnet</th><th>Yêu cầu host</th><th>Network</th><th>Broadcast</th><th>Host Min</th><th>Host Max</th><th>Mask</th>';
  } else {
    html += '<th>Subnet</th><th>Network</th><th>Broadcast</th><th>Host Min</th><th>Host Max</th><th>Mask</th>';
  }
  html += '</tr></thead><tbody>';
  rows.forEach(r => {
    html += '<tr>';
    if (mode === 'vlsm') {
      html += `<td>${r.subnet}</td><td>${r.requiredHosts}</td><td>${r.network}</td><td>${r.broadcast}</td><td>${r.hostMin}</td><td>${r.hostMax}</td><td>${r.mask}</td>`;
    } else {
      html += `<td>${r.subnet}</td><td>${r.network}</td><td>${r.broadcast}</td><td>${r.hostMin}</td><td>${r.hostMax}</td><td>${r.mask}</td>`;
    }
    html += '</tr>';
  });
  html += '</tbody></table>';
  return html;
}

document.getElementById('subnet-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const network = document.getElementById('network').value.trim();
  const input = document.getElementById('input-value').value.trim();
  const mode = document.getElementById('mode').value;
  const errorEl = document.getElementById('error-msg');
  const resultsEl = document.getElementById('results');
  errorEl.style.display = 'none';
  resultsEl.innerHTML = '';
  try {
    if (!network) throw new Error('Vui lòng nhập địa chỉ mạng hợp lệ.');
    if (!input) throw new Error('Vui lòng nhập giá trị yêu cầu.');
    let tableHtml = '';
    if (mode === 'cidr') {
      const subnetCount = parseInt(input, 10);
      if (isNaN(subnetCount) || subnetCount < 1) throw new Error('Số subnet phải là số nguyên dương.');
      const rows = calculateCIDR(network, subnetCount);
      tableHtml = '<h2>Kết quả CIDR</h2>' + buildTable(rows, 'cidr');
    } else {
      const hostList = input.split(',').map(s=>s.trim()).filter(s=>s!=='');
      if (hostList.length === 0) throw new Error('Phải cung cấp ít nhất một yêu cầu host cho VLSM.');
      const rows = calculateVLSM(network, hostList);
      tableHtml = '<h2>Kết quả VLSM</h2>' + buildTable(rows, 'vlsm');
    }
    resultsEl.innerHTML = tableHtml;
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.style.display = 'block';
  }
});
