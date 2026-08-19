
const canvas=document.getElementById('c');const ctx=canvas.getContext('2d');
const S=16;let snake=[{x:10,y:10}],dir={x:1,y:0},food={x:15,y:15},score=0,alive=true;
document.addEventListener('keydown',e=>{
  if(e.key==='ArrowUp'&&dir.y===0)dir={x:0,y:-1};
  if(e.key==='ArrowDown'&&dir.y===0)dir={x:0,y:1};
  if(e.key==='ArrowLeft'&&dir.x===0)dir={x:-1,y:0};
  if(e.key==='ArrowRight'&&dir.x===0)dir={x:1,y:0};
});
function placeFood(){food={x:Math.floor(Math.random()*20),y:Math.floor(Math.random()*20)};}
function tick(){
  if(!alive)return;
  const h={x:snake[0].x+dir.x,y:snake[0].y+dir.y};
  if(h.x<0||h.y<0||h.x>=20||h.y>=20||snake.some(s=>s.x===h.x&&s.y===h.y)){alive=false;return;}
  snake.unshift(h);
  if(h.x===food.x&&h.y===food.y){score++;document.getElementById('score').textContent='Score: '+score;placeFood();}
  else snake.pop();
  ctx.fillStyle='#020617';ctx.fillRect(0,0,320,320);
  ctx.fillStyle='#22c55e';snake.forEach(s=>ctx.fillRect(s.x*S,s.y*S,S-1,S-1));
  ctx.fillStyle='#ef4444';ctx.fillRect(food.x*S,food.y*S,S-1,S-1);
}
setInterval(tick,120);
