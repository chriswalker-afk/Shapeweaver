import {createObjectEngine} from "../core/object-engine.js";
import {getSpell} from "./identity.js";
import {screenToWorld} from "../rendering/camera.js";
import {parsePreviewRequest} from "../transformations/preview-math.js";
import {transformationFeedback} from "./transformation-feedback.js";
const format=p=>"("+p[0]+", "+p[1]+")";
const refsText=refs=>refs.map(r=>r.id+" "+format(r.point)).join(" · ");
export function mountObjectInspector(document,room,getPlayer,onChange,onToggle,actions={}){
  const $=id=>document.getElementById(id);
  const panel=$("object-panel"),toggle=$("object-toggle");
  if(!panel||!toggle)return null;
  let engine=createObjectEngine(room);
  const select=$("object-select"),spell=$("object-spell"),form=$("object-form"),fields=$("object-fields");
  const result=$("object-result"),refs=$("object-references"),permissions=$("object-permissions");
  const apply=$("object-apply"),note=$("object-preview-note");
  let active=false,selected=null,preview=null,type=null;
  const listeners=[];
  const on=(el,event,fn)=>{if(!el)return;el.addEventListener(event,fn);listeners.push([el,event,fn]);};
  function option(value,label){const el=document.createElement("option");el.value=value;el.textContent=label;return el;}
  function populate(){select.replaceChildren(option("","Choose an object…"),...engine.objects().map(o=>option(o.id,o.label??o.id)));}
  populate();
  function canApply(){return Boolean(active&&type&&actions.canApply?.(type));}
  function pathScope(){return {translate:"translation-path",rotate:"rotation-path",enlarge:"enlargement-path",reflect:"reflection-destination"}[type];}
  function syncApply(){
    if(apply){apply.hidden=!canApply();apply.disabled=!canApply()||!preview?.ok||preview.scope!==pathScope();apply.textContent=type?"Apply "+getSpell(type).label.toLowerCase():"Apply";}
    if(note)note.textContent=canApply()?"Preview, then apply when clear.":"Preview only for this spell/room.";
  }
  function makeField(id,label,placeholder="",parent=fields){
    const wrap=document.createElement("label"),input=document.createElement("input");
    wrap.textContent=label+" ";input.name=id;input.type="text";input.inputMode=id==="line"||id==="factor"?"text":"decimal";input.autocomplete="off";input.placeholder=placeholder;input.setAttribute("aria-label",label);wrap.append(input);parent.append(wrap);
    return input;
  }
  function choice(id,label,items){
    const wrap=document.createElement("label"),input=document.createElement("select");wrap.textContent=label+" ";input.name=id;input.setAttribute("aria-label",label);
    input.replaceChildren(...items.map(([v,l])=>option(v,l)));wrap.append(input);fields.append(wrap);
  }
  function buildFields(){
    fields.replaceChildren();
    if(type==="translate"){
      const vector=document.createElement("div");vector.className="vector-entry";
      vector.setAttribute("role","group");vector.setAttribute("aria-label","Column vector: horizontal then vertical");
      makeField("dx","Horizontal (x)","e.g. 4",vector);makeField("dy","Vertical (y)","e.g. −2",vector);
      fields.append(vector);
    }
    if(type==="rotate"){choice("angle","Angle",[["","Choose…"],["90","90°"],["180","180°"],["270","270°"]]);choice("direction","Direction",[["","Choose…"],["clockwise","Clockwise"],["anticlockwise","Anticlockwise"]]);}
    if(type==="enlarge")makeField("factor","Scale factor","e.g. 2 or 1/2");
    if(type==="rotate"||type==="enlarge"){makeField("cx","Centre x","x");makeField("cy","Centre y","y");}
    if(type==="reflect")makeField("line","Mirror line equation","e.g. x = 5");
    form.hidden=!type;syncApply();
  }
  function updateObject(){
    result.dataset.state="";const object=engine.get(selected);select.value=object?.id??"";
    spell.replaceChildren(option("","Choose a transformation…"),...(object?.permissions??[]).map(t=>option(t,getSpell(t).label)));
    spell.disabled=!object;spell.value=type??"";
    refs.textContent=object?refsText(engine.references(object.id)):"Select a highlighted object in the room or from the list.";
    permissions.textContent=object?"Allowed: "+object.permissions.map(t=>getSpell(t).label).join(", ")+(object.hinge?" · Fixed hinge H "+format(object.hinge):"")+(object.scaleRange?" · Scale factor per cast: "+object.scaleRange.join("–"):""):"";
    buildFields();result.textContent=object?"Choose a transformation and enter its parameters.":"No object selected.";
  }
  function selectObject(id){
    const o=engine.get(id);
    selected=o?.id??null;type=null;preview=null;updateObject();onChange();return Boolean(o);
  }
  function selectType(next){
    const o=engine.get(selected);
    type=o?.permissions.includes(next)?next:null;preview=null;result.dataset.state="";spell.value=type??"";buildFields();result.textContent=type==="reflect"?"Enter the mirror line: x = a, y = b, y = x or y = −x. Then Preview.":type?"Enter mathematical parameters, then Preview.":"Choose a permitted transformation.";onChange();
    return Boolean(type);
  }
  function showPreview(raw){
    if(!active||!selected||!type)return null;
    preview=canApply()?actions.preview(type,selected,raw):engine.preview(getPlayer(),selected,type,raw);
    result.textContent=transformationFeedback(preview,type)+(preview.ok&&preview.mechanismEffects?.length?" · "+preview.mechanismEffects.join(" "):"")+(preview.geometry?" · Image: "+refsText(preview.geometry.points):"");
    result.dataset.state=preview.ok?"clear":"invalid";syncApply();onChange();return preview;
  }
  function clearPreview(){preview=null;result.dataset.state="";result.textContent="Preview cleared. No move used.";syncApply();onChange();}
  function setActive(value){
    active=Boolean(value);panel.hidden=!active;toggle.setAttribute("aria-pressed",String(active));toggle.textContent=active?"Objects: on":"Objects";
    if(!active){selected=null;type=null;preview=null;result.dataset.state="";updateObject();}syncApply();
  }
  function pick(camera,p){
    if(!active||!p)return false;
    const hit=engine.hit(screenToWorld(camera,p),Math.min(.35,8/camera.scale));return selectObject(hit?.id??"");
  }
  on(toggle,"click",()=>onToggle(!active));on($("object-close"),"click",()=>onToggle(false));
  on(select,"change",()=>selectObject(select.value));on(spell,"change",()=>selectType(spell.value));
  function readRaw(){const raw={};for(const input of fields.querySelectorAll("input, select"))raw[input.name]=input.value.replace(/\u2212/g,"-");return raw;}
  on(form,"submit",event=>{event.preventDefault();showPreview(readRaw());});
  on(apply,"click",()=>{
    if(!canApply()||!preview?.ok||preview.scope!==pathScope())return;
    const raw=readRaw();
    // An autofill/programmatic edit must not silently apply different parameters than the ghost.
    if(JSON.stringify(parsePreviewRequest(type,raw))!==JSON.stringify(preview.request)){showPreview(raw);return;}
    const r=actions.apply(type,selected,raw);
    if(!r.ok){preview=r;result.textContent=transformationFeedback(r,type);result.dataset.state="invalid";syncApply();onChange();}
  });
  function replaceRoom(next){engine=createObjectEngine(next);selected=null;type=null;preview=null;populate();updateObject();}
  on(fields,"input",()=>{if(preview)clearPreview();});on(fields,"change",()=>{if(preview)clearPreview();});
  on($("object-clear"),"click",clearPreview);
  updateObject();setActive(false);
  return {setActive,replaceRoom,pick,selectObject,selectType,showPreview,clearPreview,getState:()=>({active,selected,type,preview,objects:engine.objects()}),destroy(){for(const [el,event,fn] of listeners)el.removeEventListener(event,fn);}};
}
