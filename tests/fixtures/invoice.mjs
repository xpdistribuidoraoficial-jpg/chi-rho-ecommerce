import {XMLParser,XMLValidator} from 'fast-xml-parser';
const parser=new XMLParser({ignoreAttributes:false,removeNSPrefix:true,parseTagValue:false,parseAttributeValue:false,processEntities:false});
export const parse=xml=>{if(XMLValidator.validate(xml)!==true)throw new Error('invalid');return parser.parse(xml);};
const prefix='3326014230039100010055001000000123112345678';
let sum=0,weight=2;for(let i=42;i>=0;i--){sum+=Number(prefix[i])*weight;weight=weight===9?2:weight+1;}
export const key=prefix+([0,1].includes(sum%11)?0:11-sum%11);
export const invoice={key,number:'123',series:'1',issuedAt:'2026-01-01T12:00:00-03:00',value:98.96,freight:15,
  issuerDocument:'42300391000100',recipientDocument:'52998224725',protocol:'123456789012345',statusCode:'100',source:'contador',environment:'production'};
export const xml=`<?xml version="1.0" encoding="UTF-8"?><nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00"><NFe><infNFe Id="NFe${key}" versao="4.00"><ide><mod>55</mod><serie>1</serie><nNF>123</nNF><tpAmb>1</tpAmb><dhEmi>2026-01-01T12:00:00-03:00</dhEmi></ide><emit><CNPJ>42300391000100</CNPJ></emit><dest><CPF>52998224725</CPF></dest><total><ICMSTot><vNF>98.96</vNF><vFrete>15.00</vFrete></ICMSTot></total></infNFe></NFe><protNFe><infProt><chNFe>${key}</chNFe><tpAmb>1</tpAmb><cStat>100</cStat><nProt>123456789012345</nProt></infProt></protNFe></nfeProc>`;
