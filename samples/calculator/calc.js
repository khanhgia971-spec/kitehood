
const display=document.getElementById('display');
const keys=['C','/','*','-','7','8','9','+','4','5','6','%','1','2','3','=','.','0','(',')'];
const box=document.getElementById('keys');
let expr='';
keys.forEach(k=>{
  const b=document.createElement('button');
  b.textContent=k;
  if('+-*/%'.includes(k))b.className='op';
  if(k==='=')b.className='eq';
  b.onclick=()=>{
    if(k==='C'){expr='';display.textContent='0';return;}
    if(k==='='){try{expr=String(Function('"use strict";return('+expr+')')());display.textContent=expr;}catch{display.textContent='Error';expr='';}return;}
    expr+=k;display.textContent=expr;
  };
  box.appendChild(b);
});
