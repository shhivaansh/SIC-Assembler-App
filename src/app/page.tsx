"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

type AssemblyLine = {
  address: string;
  label: string;
  mnemonic: string;
  operand: string;
  objectCode: string;
};

type SymbolTable = Record<string, string>;

const OPCODE_MAP: Record<string, string> = {
  "LDA": "00",
  "AND": "40",
  "DIV": "24",
  "SUB": "1C",
  "ADD": "18",
  "LDL": "08",
  "RD": "D8",
  "WD": "DC",
  "LDCH": "50",
  "STX": "10",
  "JLT": "38",
  "TIX": "2C",
  "TD": "E0",
  "STCH": "54",
  "STL": "14",
  "LDX": "04",
  "RSUB": "4C",
  "STA": "0C",
  "J": "3C",
  "JEQ": "30",
  "COMP": "26",
  "JSUB": "48",
  "JGT": "34",
  "MUL": "20",
  "OR": "44",
  "STSW": "E8"
};

export default function SICAssembler() {
  const [assemblyCode, setAssemblyCode] = useState('');
  const [programName, setProgramName] = useState('');
  const [startingAddress, setStartingAddress] = useState('1000');
  const [assemblyListing, setAssemblyListing] = useState<AssemblyLine[]>([]);
  const [symbolTable, setSymbolTable] = useState<SymbolTable>({});
  const [objectProgram, setObjectProgram] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);

  const hexToDec = (hex: string): number => parseInt(hex, 16);
  const decToHex = (num: number): string => num.toString(16).toUpperCase();

  const getOpcode = (mnemonic: string): string => {
    return OPCODE_MAP[mnemonic] || "-1";
  };

  const pass1 = () => {
    const lines = assemblyCode.split('\n').filter(line => line.trim() !== '');
    const listing: AssemblyLine[] = [];
    const symbols: SymbolTable = {};
    
    let currentAddress = startingAddress;
    
    for (const line of lines) {
      const parts = line.split(/\s+/).filter(part => part !== '');
      let label = '', mnemonic = '', operand = '';
      
      if (parts.length === 3) {
        [label, mnemonic, operand] = parts;
      } else if (parts.length === 2) {
        [mnemonic, operand] = parts;
      } else if (parts.length === 1) {
        [mnemonic] = parts;
      }
      
      listing.push({
        address: currentAddress,
        label,
        mnemonic,
        operand,
        objectCode: ''
      });
      
      if (label) {
        symbols[label] = currentAddress;
      }
      
      if (mnemonic === 'RESW') {
        const words = parseInt(operand);
        currentAddress = decToHex(hexToDec(currentAddress) + 3 * words);
      } else if (mnemonic === 'RESB') {
        const bytes = parseInt(operand);
        currentAddress = decToHex(hexToDec(currentAddress) + bytes);
      } else if (mnemonic === 'BYTE') {
        if (operand.startsWith('C')) {
          const length = operand.length - 3;
          currentAddress = decToHex(hexToDec(currentAddress) + length);
        } else if (operand.startsWith('X')) {
          const length = Math.ceil((operand.length - 3) / 2);
          currentAddress = decToHex(hexToDec(currentAddress) + length);
        }
      } else if (mnemonic !== 'END') {
        currentAddress = decToHex(hexToDec(currentAddress) + 3);
      }
    }
    
    return { listing, symbols };
  };

  const pass2 = (listing: AssemblyLine[], symbols: SymbolTable) => {
    const updatedListing = [...listing];
    const objectProgramLines: string[] = [];
    
    const programLength = hexToDec(listing[listing.length - 1].address) - 
                         hexToDec(startingAddress);
    
    objectProgramLines.push(`H ${programName.padEnd(6, ' ')} ${startingAddress.padStart(6, '0')} ${decToHex(programLength).padStart(6, '0')}`);
    
    let currentTextRecord = '';
    let currentRecordLength = 0;
    let currentRecordStart = '';
    let firstExecutableAddress = '';
    
    for (let i = 0; i < updatedListing.length; i++) {
      const line = updatedListing[i];
      let objectCode = '';
      
      if (line.mnemonic === 'RESW' || line.mnemonic === 'RESB' || line.mnemonic === 'END') {
        objectCode = '';
      } else if (line.mnemonic === 'BYTE') {
        if (line.operand.startsWith('C')) {
          const chars = line.operand.substring(2, line.operand.length - 1);
          objectCode = Array.from(chars).map(c => c.charCodeAt(0).toString(16).toUpperCase()).join('');
        } else if (line.operand.startsWith('X')) {
          objectCode = line.operand.substring(2, line.operand.length - 1);
        }
      } else if (line.mnemonic === 'WORD') {
        objectCode = parseInt(line.operand).toString(16).toUpperCase().padStart(6, '0');
      } else {
        const opcode = getOpcode(line.mnemonic);
        if (opcode === '-1') {
          objectCode = '';
        } else {
          let address = '0000';
          if (line.operand) {
            const operand = line.operand.split(',')[0];
            address = symbols[operand] || '0000';
            
            if (line.operand.includes(',')) {
              address = decToHex(hexToDec(address) + 0x8000);
            }
          }
          objectCode = opcode + address;
        }
      }
      
      if (objectCode.length < 6 && objectCode.length > 0) {
        objectCode = objectCode.padStart(6, '0');
      }
      
      updatedListing[i].objectCode = objectCode;
      
      if (objectCode && objectCode !== '4C0000') {
        if (!currentTextRecord) {
          currentRecordStart = line.address;
          firstExecutableAddress = firstExecutableAddress || line.address;
        }
        
        currentTextRecord += objectCode;
        currentRecordLength += objectCode.length / 2;
        
        if (currentRecordLength >= 30 || 
            (i < updatedListing.length - 1 && 
             (updatedListing[i + 1].mnemonic === 'RESW' || 
              updatedListing[i + 1].mnemonic === 'RESB' || 
              updatedListing[i + 1].mnemonic === 'END'))) {
          objectProgramLines.push(`T ${currentRecordStart.padStart(6, '0')} ${currentRecordLength.toString(16).toUpperCase().padStart(2, '0')} ${currentTextRecord}`);
          currentTextRecord = '';
          currentRecordLength = 0;
        }
      }
    }
    
    objectProgramLines.push(`E ${firstExecutableAddress.padStart(6, '0')}`);
    
    return { updatedListing, objectProgramLines };
  };

  const assemble = () => {
    if (!assemblyCode.trim()) return;
    
    const { listing, symbols } = pass1();
    const { updatedListing, objectProgramLines } = pass2(listing, symbols);
    
    setAssemblyListing(updatedListing);
    setSymbolTable(symbols);
    setObjectProgram(objectProgramLines);
    setShowResults(true);
  };

  const resetForm = () => {
    setAssemblyCode('');
    setProgramName('');
    setStartingAddress('1000');
    setAssemblyListing([]);
    setSymbolTable({});
    setObjectProgram([]);
    setShowResults(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-800">SIC Assembler</CardTitle>
            <CardDescription className="text-gray-600">
              A two-pass assembler for SIC machine code
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label htmlFor="program-name" className="text-gray-700">Program Name</Label>
                <Input
                  id="program-name"
                  value={programName}
                  onChange={(e) => setProgramName(e.target.value)}
                  maxLength={6}
                  placeholder="Max 6 chars"
                  className="bg-white"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="starting-address" className="text-gray-700">Starting Address (Hex)</Label>
                <Input
                  id="starting-address"
                  value={startingAddress}
                  onChange={(e) => setStartingAddress(e.target.value)}
                  placeholder="e.g. 1000"
                  className="bg-white font-mono"
                />
              </div>
              <div className="flex items-end space-x-2">
                <Button onClick={assemble} className="w-full bg-blue-600 hover:bg-blue-700">
                  Assemble
                </Button>
              </div>
              <div></div>
              <div></div>
              <div>
                <Button onClick={resetForm} variant="outline" className="w-full">
                  Reset
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="assembly-code" className="text-gray-700">Assembly Code</Label>
              <Textarea
                id="assembly-code"
                value={assemblyCode}
                onChange={(e) => setAssemblyCode(e.target.value)}
                rows={12}
                className="bg-white font-mono text-sm"
                placeholder={`COPY    START   1000\n        LDA     ALPHA\n        ADD     ONE\n        STA     BETA\nALPHA   WORD    5\nONE     WORD    1\nBETA    RESW    1\n        END     COPY`}
              />
            </div>
          </CardContent>
        </Card>

        {showResults && (
          <Tabs defaultValue="listing" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-100">
              <TabsTrigger value="listing" className="py-2">Assembly Listing</TabsTrigger>
              <TabsTrigger value="symbols" className="py-2">Symbol Table</TabsTrigger>
              <TabsTrigger value="object" className="py-2">Object Program</TabsTrigger>
            </TabsList>
            
            <TabsContent value="listing">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl">Assembly Listing</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] rounded-md border">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Label</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mnemonic</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operand</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Object Code</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {assemblyListing.map((line, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-mono text-gray-900">{line.address}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{line.label || ''}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{line.mnemonic}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{line.operand || ''}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-mono text-blue-600">{line.objectCode || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="symbols">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl">Symbol Table</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] rounded-md border">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Label</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Object.entries(symbolTable).map(([label, address], index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{label}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-mono text-blue-600">{address}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="object">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl">Object Program</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] rounded-md border bg-gray-900 p-4">
                    <div className="font-mono text-sm text-green-400 space-y-1">
                      {objectProgram.map((line, index) => (
                        <div key={index} className="hover:bg-gray-800 px-2 py-1 rounded">
                          {line}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
