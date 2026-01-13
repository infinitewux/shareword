const API = 'https://whoisteacher.infinitewux.workers.dev'

// 将月份英文缩写（如 "jan"、"January"、"Jan."）转换为数字（1-12）。
function monthAbbrevToNumber(abbrev) {
  if (!abbrev) return null
  const s = String(abbrev).toLowerCase().replace(/[^a-z]/g, '').slice(0, 3)
  const map = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
  }
  return map[s] || null
}

let currentfilename = null

async function loadList() {
  const res = await fetch(`${API}/list`)
  const data = await res.json()

  const nav = document.getElementById('nav')
  nav.innerHTML = ''

  Object.entries(data.sites).forEach(([host, paths]) => {
    console.log('host', host, paths)
    const site = document.createElement('div')
    site.className = 'site font-bold mt-3'
    site.textContent = host
    nav.appendChild(site)

    // 先按路径中的日期（year/month/day，位于倒数第4/3/2 个段）解析并排序（降序，最新在前）
    const sorted = paths.slice().sort((a, b) => {
      const parseDate = p => {
        const parts = p.split('/').filter(Boolean)
        if (parts.length < 4) return null
        const len = parts.length
        const year = Number(parts[len - 4])
        const monthRaw = parts[len - 3]
        const day = Number(parts[len - 2])
        const monthNum = monthAbbrevToNumber(monthRaw) || Number(monthRaw)
        if (!Number.isFinite(year) || !Number.isFinite(monthNum) || !Number.isFinite(day)) return null
        return new Date(year, monthNum - 1, day)
      }

      const da = parseDate(a)
      const db = parseDate(b)
      if (da && db) return db - da // 降序（最新先）
      if (da) return -1
      if (db) return 1
      return a.localeCompare(b)
    })

    sorted.forEach(path => {
      const parts = path.split('/').filter(Boolean)
      const len = parts.length
      let titleText = parts[len - 1] || path

      if (len >= 4) {
        const day = parts[len - 2]
        const monthRaw = parts[len - 3]
        const year = parts[len - 4]
        const monthNum = monthAbbrevToNumber(monthRaw) || monthRaw
        titleText = `${year}-${monthNum}-${day}//${titleText}`
      }

      const page = document.createElement('div')
      page.className = 'page cursor-pointer p-1 ml-2 rounded hover:bg-gray-100'
      page.textContent = titleText
      page.onclick = () => {
        currentfilename = titleText
        loadPage(host + path)
      }
      nav.appendChild(page)
    })
  })
}



function loadPage(domain) {
  const url = `https://${domain}`
  let yearindex = 0
  const titles = domain.split('/').map((part, index) => {
    console.log('part', part, index)
    if (Number.isInteger(Number(part)) && yearindex === 0) {
      yearindex = index
      return part
    }
    if (yearindex !== 0) {
      if (index === yearindex + 1) return monthAbbrevToNumber(part)
      else if (index === yearindex + 2) return part
      else return ''
    }
  }).filter(Boolean).join('-')



  fetch(`${API}?domain=${encodeURIComponent(domain)}`)
    .then(res => res.json())
    .then(data => {
      const link = document.getElementById('titleLink')
      link.textContent = currentfilename || titles || domain
      link.href = url

      const ul = document.getElementById('content')
      ul.innerHTML = ''

      data.words.forEach(w => {
        const li = document.createElement('li')
        li.className = 'nav-item border-b border-gray-100 py-1 leading-7'
        li.textContent = w
        ul.appendChild(li)
      })
    })
}

document.addEventListener('DOMContentLoaded', () => {
  loadList()
})

function exportToXML() {
  const items = Array.from(document.querySelectorAll('#content li'))
  if (items.length === 0) {
    alert('当前没有要导出的单词。请先加载页面。')
    return
  }

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<wordbook>\n'

  items.forEach(li => {
    const words = li.textContent.trim().split(' ')
    const word = words[0]
    const explain = words[1]
    if (!word) return

    xml += '  <item>\n'
    xml += `    <word>${escapeXml(word)}</word>\n`
    xml += `    <trans><![CDATA[[${explain}]]]></trans>\n`
    xml += `    <phonetic><![CDATA[[${word}]]]></phonetic>\n`
    xml += `    <lanfrom><![CDATA[en]]></lanfrom>\n`
    xml += `    <lanto><![CDATA[zh-CHS]]></lanto>\n`
    xml += `    <tags>未分组单词</tags>\n`
    xml += `    <progress>0</progress>\n`
    xml += '  </item>\n'
  })

  xml += '</wordbook>'

  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${currentfilename}.xml`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'\"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '&': return '&amp;'
      case "'": return '&apos;'
      case '"': return '&quot;'
    }
  })
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('export-xml')
  if (btn) btn.addEventListener('click', exportToXML)
})