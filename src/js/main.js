const API = 'https://whoisteacher.infinitewux.workers.dev'

async function loadList() {
  const res = await fetch(`${API}/list`)
  const data = await res.json()

  const nav = document.getElementById('nav')
  nav.innerHTML = ''

  Object.entries(data.sites).forEach(([host, paths]) => {
    const site = document.createElement('div')
    site.className = 'site font-bold mt-3'
    site.textContent = host
    nav.appendChild(site)

    paths.forEach(path => {
      const page = document.createElement('div')
      page.className = 'page cursor-pointer p-1 ml-2 rounded hover:bg-gray-100'
      page.textContent = path
      page.onclick = () => loadPage(host + path)
      nav.appendChild(page)
    })
  })
}

function loadPage(domain) {
  const url = `https://${domain}`

  fetch(`${API}?domain=${encodeURIComponent(domain)}`)
    .then(res => res.json())
    .then(data => {
      const link = document.getElementById('titleLink')
      link.textContent = domain
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