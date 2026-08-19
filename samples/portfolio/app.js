const projects = [
  { title: 'Todo App', desc: 'Vanilla JS' },
  { title: 'Landing Page', desc: 'HTML/CSS' },
  { title: 'API Weather', desc: 'Fetch API' },
];
const list = document.getElementById('list');
projects.forEach(p => {
  const li = document.createElement('li');
  li.innerHTML = '<strong>' + p.title + '</strong><br/><span style="opacity:.7">' + p.desc + '</span>';
  list.appendChild(li);
});
