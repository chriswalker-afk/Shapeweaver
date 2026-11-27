import {createObjectEngine} from "../core/object-engine.js";
import {getSpell} from "./identity.js";
import {screenToWorld} from "../rendering/camera.js";
const format=p=>"("+p[0]+", "+p[1]+")";
const refsText=refs=>refs.map(r=>r.id+" "+format(r.point)).join(" · ");
export function mountObjectInspector(document,room,getPlayer,onChange,onToggle){
  const $=id=>document.getElementById(id);
  const panel=$("object-panel"),toggle=$("object-toggle");
  if(!panel||!toggle)return null;
  const engine=createObjectEngine(room),select=$("object-select"),spell=$("object-spell"),form=$("object-form"),fields=$("object-fields");
  const result=$("object-result"),refs=$("object-references"),permissions=$("object-permissions");
  let active=false,selected=null,preview=null,type=null;
  const listeners=[];
  const on=(el,event,fn)=>{if(!el)return;el.addEventListener(event,fn);listeners.push([el,event,fn]);};
  function option(value,label){const el=document.createElement("option");el.value=value;el.textContent=label;return el;}
  select.replaceChildren(option("","Choose an object…"),...engine.objects().map(o=>option(o.id,o.label??o.id)));
  function makeField(id,label,placeholder=""){
    const wrap=document.createElement("label"),input=document.createElement("input");
    wrap.textContent=label+" ";input.name=id;input.type="text";input.inputMode=id==="line"?"text":"decimal";input.autocomplete="off";input.placeholder=placeholder;input.setAttribute("aria-label",label);wrap.append(input);fields.append(wrap);
    return input;
  }
  function choice(id,label,items){
    const wrap=document.createElement("label"),input=document.createElement("select");wrap.textContent=label+" ";input.name=id;input.setAttribute("aria-label",label);
    input.replaceChildren(...items.map(([v,l])=>option(v,l)));wrap.append(input);fields.append(wrap);
  }
  function buildFields(){
    fields.replaceChildren();
    if(type==="translate"){makeField("dx","Horizontal (x)","e.g. 4");makeField("dy","Vertical (y)","e.g. −2");}
    if(type==="rotate"){choice("angle","Angle",[["","Choose…"],["90","90°"],["180","180°"],["270","270°"]]);choice("direction","Direction",[["","Choose…"],["clockwise","Clockwise"],["anticlockwise","Anticlockwise"]]);}
    if(type==="enlarge")makeField("factor","Scale factor","e.g. 2 or 1/2");
    if(type==="rotate"||type==="enlarge"){makeField("cx","Centre x","x");makeField("cy","Centre y","y");}
    if(type==="reflect")makeField("line","Mirror line","e.g. x = 5");
    form.hidden=!type;
  }
  function updateObject(){
    result.dataset.state="";const object=engine.get(selected);select.value=object?.id??"";
    spell.replaceChildren(option("","Choose a transformation…"),...(object?.permissions??[]).map(t=>option(t,getSpell(t).label)));
    spell.disabled=!object;spell.value=type??"";
    refs.textContent=object?refsText(engine.references(object.id)):"Select a highlighted object in the room or from the list.";
    permissions.textContent=object?"Allowed: "+object.permissions.map(t=>getSpell(t).label).join(", ")+(object.hinge?" · Fixed hinge H "+format(object.hinge):"")+(object.scaleRange?" · Scale "+object.scaleRange.join("–"):""):"";
    buildFields();result.textContent=object?"Choose a transformation and enter its parameters.":"No object selected.";
  }
  function selectObject(id){
    const o=engine.get(id);
    selected=o?.id??null;type=null;preview=null;updateObject();onChange();return Boolean(o);
  }
  function selectType(next){
    const o=engine.get(selected);
    type=o?.permissions.includes(next)?next:null;preview=null;result.dataset.state="";spell.value=type??"";buildFields();result.textContent=type?"Enter mathematical parameters, then Preview.":"Choose a permitted transformation.";onChange();
    return Boolean(type);
  }
  function showPreview(raw){
    if(!active||!selected||!type)return null;
    preview=engine.preview(getPlayer(),selected,type,raw);
    result.textContent=preview.message+(preview.geometry?" · Image: "+refsText(preview.geometry.points):"");
    result.dataset.state=preview.ok?"clear":"invalid";onChange();return preview;
  }
  function clearPreview(){preview=null;result.dataset.state="";result.textContent="Preview cleared.";onChange();}
  function setActive(value){
    active=Boolean(value);panel.hidden=!active;toggle.setAttribute("aria-pressed",String(active));toggle.textContent=active?"Objects: on":"Objects";
    if(!active){selected=null;type=null;preview=null;result.dataset.state="";updateObject();}
  }
  function pick(camera,p){
    if(!active||!p)return false;
    const hit=engine.hit(screenToWorld(camera,p),Math.min(.35,8/camera.scale));return selectObject(hit?.id??"");
  }
  on(toggle,"click",()=>onToggle(!active));on($("object-close"),"click",()=>onToggle(false));
  on(select,"change",()=>selectObject(select.value));on(spell,"change",()=>selectType(spell.value));
  on(form,"submit",event=>{event.preventDefault();const raw={};for(const input of fields.querySelectorAll("input, select"))raw[input.name]=input.value.replace(/\u2212/g,"-");showPreview(raw);});
  on(fields,"input",()=>{if(preview)clearPreview();});on(fields,"change",()=>{if(preview)clearPreview();});
  on($("object-clear"),"click",clearPreview);
  updateObject();setActive(false);
  return {setActive,pick,selectObject,selectType,showPreview,clearPreview,getState:()=>({active,selected,type,preview,objects:engine.objects()}),destroy(){for(const [el,event,fn] of listeners)el.removeEventListener(event,fn);}};
}
