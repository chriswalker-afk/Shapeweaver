// Original short synthesized cues, no network, audio assets, microphone, or
// background music. Audio is presentation only and never gates a cast.
const CUES=Object.freeze({
 translate:[[392,.09],[523.25,.13]],rotate:[[440,.08],[659.25,.16]],
 enlarge:[[261.63,.10],[392,.10],[523.25,.17]],reflect:[[659.25,.08],[440,.08],[783.99,.13]],
 mechanism:[[523.25,.08],[698.46,.12]],checkpoint:[[440,.10],[587.33,.16]],
 return:[[330,.10],[220,.15]],undo:[[392,.09],[293.66,.13]],
 complete:[[392,.10],[523.25,.12],[659.25,.13],[783.99,.24]]
});
export function createGameAudio(view,preferences){
 let context=null,master=null,closed=false;const voices=new Set();
 function silence(){
  for(const oscillator of voices){try{oscillator.stop();oscillator.disconnect?.();}catch{}}
  voices.clear();
 }
 function unlock(){
  if(closed||!preferences.sound)return false;
  try{
   if(!context){
    const Audio=view?.AudioContext??view?.webkitAudioContext;
    if(typeof Audio!=="function")return false;
    context=new Audio();master=context.createGain();master.gain.value=.12;master.connect(context.destination);
   }
   if(context.state==="suspended")context.resume()?.catch?.(()=>{});
   return true;
  }catch{return false;}
 }
 function play(cue){
  if(closed||!preferences.sound||!context||context.state!=="running"||!CUES[cue])return false;
  try{
   let time=context.currentTime+.005;
   for(const [frequency,duration] of CUES[cue]){
    const oscillator=context.createOscillator(),gain=context.createGain();
    oscillator.type="sine";oscillator.frequency.setValueAtTime(frequency,time);
    gain.gain.setValueAtTime(.0001,time);gain.gain.exponentialRampToValueAtTime(.36,time+.012);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);
    oscillator.connect(gain);gain.connect(master);voices.add(oscillator);
    oscillator.onended=()=>{voices.delete(oscillator);try{oscillator.disconnect();gain.disconnect();}catch{}};
    oscillator.start(time);oscillator.stop(time+duration+.01);time+=duration*.8;
   }
   return true;
  }catch{return false;}
 }
 function setEnabled(value){
  preferences.setSound(value);
  if(preferences.sound)unlock();else silence();
  return preferences.sound;
 }
 return {unlock,play,silence,setEnabled,destroy(){closed=true;silence();try{context?.close()?.catch?.(()=>{});}catch{}}};
}
