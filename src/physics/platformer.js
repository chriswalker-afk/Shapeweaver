import {blocked,inHazard,supported,sweepAxis,walkHorizontal,PLAYER_SIZE} from "./collision.js";
export const FIXED_DT=1/120;
export const MOTION=Object.freeze({speed:7.2,groundAcceleration:65,airAcceleration:34,gravity:25,jumpSpeed:12.2,terminalSpeed:18,climbSpeed:3.8,coyote:.11,buffer:.12});
const approach=(a,b,d)=>a<b?Math.min(a+d,b):Math.max(a-d,b);
const axis=n=>Number.isFinite(n)?Math.max(-1,Math.min(1,n)):0;
function safe(world,p){return p&&!blocked(world,p)&&!inHazard(world,p)&&supported(world,p);}
export function createPlayer(world){
  const {spawn}=world.room;
  if(!safe(world,spawn))throw new Error("Spawn must be clear, dry and supported");
  return {x:spawn.x,y:spawn.y,vx:0,vy:0,grounded:true,climbing:false,facing:1,coyote:MOTION.coyote,buffer:0,
    phase:0,pose:"idle",checkpoint:null,respawns:0,completed:false,blockedRespawn:false,event:null};
}
function reachableLadder(world,p){
  return world.ladders.find(l=>Math.abs(p.x-l.x)<=l.width/2+PLAYER_SIZE.width/2+.06&&p.y<=l.top+.025&&p.y+PLAYER_SIZE.height>l.bottom+.025)??null;
}
function respawn(world,p){
  const cp=world.checkpoints.find(c=>c.id===p.checkpoint);
  const destination=[cp,world.room.spawn].find(q=>safe(world,q));
  if(!destination)return {...p,vx:0,vy:0,climbing:false,blockedRespawn:true,event:"reset-required"};
  return {...p,x:destination.x,y:destination.y,vx:0,vy:0,grounded:true,climbing:false,coyote:MOTION.coyote,buffer:0,
    pose:"idle",phase:0,checkpoint:destination===cp?cp.id:null,respawns:p.respawns+1,event:"respawn"};
}
function finishStep(world,p,previous){
  if(inHazard(world,p))return respawn(world,p);
  if(p.grounded&&!p.climbing){
    for(const c of world.checkpoints){
      if(Math.abs(p.x-c.x)<=.7&&Math.abs(p.y-c.y)<=.12&&safe(world,c)&&p.checkpoint!==c.id){
        p.checkpoint=c.id;p.event="checkpoint";
      }
    }
  }
  const e=world.room.exit;
  // Require the feet to enter the usable portal from the level, not merely overlap its artwork while falling.
  if(p.grounded&&Math.abs(p.x-e.x)<=e.width/2-.1&&p.y>=e.y-.035&&p.y<e.y+e.height*.35){
    p.completed=true;p.vx=0;p.vy=0;p.pose="idle";p.event="exit";return p;
  }
  const distance=Math.hypot(p.x-previous.x,p.y-previous.y);
  p.phase=(previous.phase+distance*10)%(Math.PI*2);
  p.pose=p.climbing?"climb":!p.grounded?"jump":Math.abs(p.x-previous.x)>1e-5?"walk":"idle";
  return p;
}
/** Pure fixed-step simulation. Input jump is a one-shot press, not a held auto-repeat. */
export function stepPlayer(world,previous,input={}){
  if(previous.completed||previous.blockedRespawn)return previous;
  const dt=FIXED_DT,p={...previous,event:null},move=axis(input.move),climb=axis(input.climb);
  p.grounded=supported(world,p);
  p.coyote=p.grounded?MOTION.coyote:Math.max(0,p.coyote-dt);
  p.buffer=input.jump?MOTION.buffer:Math.max(0,p.buffer-dt);
  if(move)p.facing=Math.sign(move);
  const ladder=reachableLadder(world,p);
  if(ladder&&!move&&!input.jump&&(climb||p.climbing)){
    p.climbing=true;p.vx=0;p.vy=0;p.coyote=0;
    const dy=climb*MOTION.climbSpeed*dt;
    const amount=dy>0?Math.max(0,Math.min(dy,ladder.top-p.y)):Math.min(0,Math.max(dy,ladder.bottom-p.y));
    const next=sweepAxis(world,p,"y",amount);
    p.y=next.y;p.grounded=supported(world,p);
    return finishStep(world,p,previous);
  }
  const fromLadder=p.climbing&&ladder;
  p.climbing=false;
  let jumped=false;
  if(p.buffer>0&&(p.coyote>0||fromLadder)){
    p.vy=MOTION.jumpSpeed;p.buffer=0;p.coyote=0;p.grounded=false;jumped=true;
  }
  p.vx=approach(p.vx,move*MOTION.speed,(p.grounded?MOTION.groundAcceleration:MOTION.airAcceleration)*dt);
  const horizontal=walkHorizontal(world,p,p.vx*dt,p.grounded&&!jumped);
  p.x=horizontal.x;p.y=horizontal.y;if(horizontal.hit)p.vx=0;
  // If the player walked off an edge, gravity begins immediately. Ground probe is not a teleport.
  p.grounded=!jumped&&p.vy<=0&&supported(world,p);
  if(p.grounded){p.vy=0;}
  else{
    p.vy=Math.max(-MOTION.terminalSpeed,p.vy-MOTION.gravity*dt);
    const vertical=sweepAxis(world,p,"y",p.vy*dt);
    p.y=vertical.y;
    if(vertical.hit){p.grounded=p.vy<0;p.vy=0;}
  }
  if(!jumped&&p.vy<=0&&supported(world,p))p.grounded=true;
  return finishStep(world,p,previous);
}
