/*
 * Copyright (c) 2018, Gnock
 * Copyright (c) 2018, The Masari Project
 * Copyright (c) 2018, The Bitcoinnova Project
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import {RawWallet, Wallet} from "./Wallet";
import {CoinUri} from "./CoinUri";
import {Storage} from "./Storage";
import { Mnemonic } from "../model/Mnemonic";

export class WalletRepository{

	static hasOneStored() : Promise<boolean>{
		return Storage.getItem('wallet', null).then(function (wallet : any) {
			return wallet !== null;
		});
	}
	
	static getWithPassword(rawWallet : RawWallet, password : string) : Wallet|null{
		if(password.length > 32)
			password = password.substr(0 , 32);
		if(password.length < 32){
			password = ('00000000000000000000000000000000'+password).slice(-32);
		}

		let privKey = new (<any>TextEncoder)("utf8").encode(password);
		let nonce = new (<any>TextEncoder)("utf8").encode(rawWallet.nonce);
		// rawWallet.encryptedKeys = this.b64DecodeUnicode(rawWallet.encryptedKeys);
		let encrypted = new Uint8Array(<any>rawWallet.encryptedKeys);
		let decrypted = nacl.secretbox.open(encrypted, nonce, privKey);
		if(decrypted === null)
			return null;
		rawWallet.encryptedKeys = new TextDecoder("utf8").decode(decrypted);
		return Wallet.loadFromRaw(rawWallet);
	}

	static getLocalWalletWithPassword(password : string) : Promise<Wallet|null>{
		return Storage.getItem('wallet', null).then((existingWallet : any) => {
			//console.log(existingWallet);
			if(existingWallet !== null){
				//console.log(JSON.parse(existingWallet));
				let wallet : Wallet|null = this.getWithPassword(JSON.parse(existingWallet), password);
				//console.log(wallet);
				return wallet;
			}else{
				return null;
			}
		});
	}
	
	static save(wallet : Wallet, password : string) : Promise<void>{
		let rawWallet = this.getEncrypted(wallet, password);
		return Storage.setItem('wallet', JSON.stringify(rawWallet));
	}

	static getEncrypted(wallet : Wallet, password : string){
		if(password.length > 32)
			password = password.substr(0 , 32);
		if(password.length < 32){
			password = ('00000000000000000000000000000000'+password).slice(-32);
		}

		let privKey = new (<any>TextEncoder)("utf8").encode(password);
		let rawNonce = nacl.util.encodeBase64(nacl.randomBytes(16));
		let nonce = new (<any>TextEncoder)("utf8").encode(rawNonce);
		let rawWallet = wallet.exportToRaw();
		let uint8EncryptedKeys = new (<any>TextEncoder)("utf8").encode(rawWallet.encryptedKeys);

		let encrypted : Uint8Array = nacl.secretbox(uint8EncryptedKeys, nonce, privKey);
		rawWallet.encryptedKeys = <any>encrypted.buffer;
		let tabEncrypted = [];
		for(let i = 0; i < encrypted.length; ++i){
			tabEncrypted.push(encrypted[i]);
		}
		rawWallet.encryptedKeys = <any>tabEncrypted;
		rawWallet.nonce = rawNonce;
		return rawWallet;
	}

	static deleteLocalCopy() : Promise<void>{
		return Storage.remove('wallet');
	}

    static dottedLine(doc: any, xFrom: number, yFrom: number, xTo: number, yTo: number, segmentLength: number) {
        // Calculate line length (c)
        var a = Math.abs(xTo - xFrom);
        var b = Math.abs(yTo - yFrom);
        var c = Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));

        // Make sure we have an odd number of line segments (drawn or blank) to fit it nicely
        var fractions = c / segmentLength;
        var adjustedSegmentLength = (Math.floor(fractions) % 2 === 0) ? (c / Math.ceil(fractions)) : (c / Math.floor(fractions));

        // Calculate x, y deltas per segment
        var deltaX = adjustedSegmentLength * (a / c);
        var deltaY = adjustedSegmentLength * (b / c);

        var curX = xFrom, curY = yFrom;
        while (curX <= xTo && curY <= yTo) {
            doc.line(curX, curY, curX + deltaX, curY + deltaY);
            curX += 2 * deltaX;
            curY += 2 * deltaY;
        }
    }

	static downloadEncryptedPdf(wallet : Wallet){
		if(wallet.keys.priv.spend === '')
			throw 'missing_spend';

		let coinWalletUri = CoinUri.encodeWalletKeys(
			wallet.getPublicAddress(),
			wallet.keys.priv.spend,
			wallet.keys.priv.view,
			wallet.creationHeight
		);

		let publicQrCode = kjua({
			render: 'canvas',
			text: wallet.getPublicAddress(),
			size:300,
		});

        let privateSpendQrCode = kjua({
            render: 'canvas',
            text: wallet.keys.priv.spend,
            size: 300,
        });

        let privateViewQrCode = kjua({
            render: 'canvas',
            text: wallet.keys.priv.view,
            size: 300,
        });

        
        let logo = "data:image/png;base64,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";

		let doc = new jsPDF('landscape');

        // background color
        doc.setFillColor(9, 27, 38);
        doc.rect(0, 0, 297, 210, "F");

        

        // middle line
        doc.setLineWidth(0.2);
        doc.setDrawColor(255, 255, 255);
        this.dottedLine(doc, 0, 105, 297, 105, 2);
        // column lines
        doc.setDrawColor(255, 255, 255);
        this.dottedLine(doc, 99, 0, 99, 210, 2);
        this.dottedLine(doc, 198, 0, 198, 210, 2);


        // BOX 1 [x = 5, y = 10]
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(35, 190, 226);
        doc.rect(5, 5, 90, 90, "F");
        doc.setFillColor(35, 190, 226);
        doc.rect(5, 75, 90, 15, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(30);
        doc.text('Private View', 79, 79, null, 180);
        doc.addImage(privateViewQrCode, 'PNG', 25, 20, 50, 50);
        let qrViewText = wallet.keys.priv.view;
        let qrViewSplit = Math.ceil(qrViewText.length / 2);
        doc.setFontSize(8)
        doc.setTextColor(0, 0, 0)
        doc.text(qrViewText.slice(0, qrViewSplit), 74, 15, null, 180);
        doc.text(qrViewText.slice(qrViewSplit), 74, 11, null, 180);


        // BOX 2 - [x = 104, y = 10]
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(35, 190, 226);
        doc.rect(104, 5, 90, 90, "F");
        doc.setFillColor(35, 190, 226);
        doc.rect(104, 75, 90, 15, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(30);
        doc.text('Private Spend', 182.5, 79, null, 180);
        doc.addImage(privateSpendQrCode, 'PNG', 124, 20, 50, 50);
        let qrSpendText = wallet.keys.priv.spend;
        let qrSpendSplit = Math.ceil(qrSpendText.length / 2);
        doc.setFontSize(8)
        doc.setTextColor(0, 0, 0)
        doc.text(qrSpendText.slice(0, qrSpendSplit), 174, 15, null, 180);
        doc.text(qrSpendText.slice(qrSpendSplit), 174, 11, null, 180);


        // BOX 3 - [x = 203, y = 10]
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(35, 190, 226);
        doc.rect(203, 5, 90, 90, "F");
        doc.setFillColor(35, 190, 226);
        doc.rect(203, 75, 90, 15, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(30);
        doc.text('Mnemonic Seed', 286, 79, null, 180);
        //todo, add mnemonic text
        doc.setFontSize(12)
        let mnemon = Mnemonic.mn_encode(wallet.keys.priv.spend, "english");
        let mnemonicWords = mnemon !== null ? mnemon.split(' ') : [];
        doc.setTextColor(0, 0, 0);
        try {
            let lineOne = mnemonicWords.splice(0, 5);
            let lineTwo = mnemonicWords.splice(0, 5);
            let lineThree = mnemonicWords.splice(0, 5);
            let lineFour = mnemonicWords.splice(0, 5);
            let lineFive = mnemonicWords.splice(0, 5);
            let startPos = 291;
            let strLineOne = lineOne.join(' ');
            let startLineOne = startPos - parseInt(Math.floor((50 - strLineOne.length) / 2).toString());
            doc.text(strLineOne, startLineOne, 63, null, 180);
            let strLineTwo = lineTwo.join(' ');
            let startLineTwo = startPos - parseInt(Math.floor((50 - strLineTwo.length) / 2).toString());
            doc.text(strLineTwo, startLineTwo, 52, null, 180);
            let strLineThree = lineThree.join(' ');
            let startLineThree = startPos - parseInt(Math.floor((50 - strLineThree.length) / 2).toString());
            doc.text(strLineThree, startLineThree, 39, null, 180);
            let strLineFour = lineFour.join(' ');
            let startLineFour = startPos - parseInt(Math.floor((50 - strLineFour.length) / 2).toString());
            doc.text(strLineFour, startLineFour, 27, null, 180);
            let strLineFive = lineFive.join(' ');
            let startLineFive = startPos - parseInt(Math.floor((50 - strLineFive.length) / 2).toString());
            doc.text(strLineFive, startLineFive, 15, null, 180);
        }
        catch (e) {
            console.log("Couldn't get Mnemonic, ignoring!");
        }
        // BOX 4 - [x = 0, y = 100]
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(35, 190, 226);
        doc.rect(5, 115, 90, 90, "F");
        doc.setFillColor(35, 190, 226);
        doc.rect(5, 120, 90, 15, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(30);
        doc.text('Public Wallet', 20, 132, null, 0);
        doc.addImage(publicQrCode, 'PNG', 25, 140, 50, 50);
        let qrPublicText = wallet.getPublicAddress();
        let qrPublicSplit = Math.ceil(qrPublicText.length / 3);
        doc.setFontSize(8)
        doc.setTextColor(0, 0, 0)
        doc.text(qrPublicText.slice(0, qrPublicSplit), 23, 194, null, 0);
        doc.text(qrPublicText.slice(qrPublicSplit, qrPublicSplit * 2), 22, 198, null, 0);
        doc.text(qrPublicText.slice(qrPublicSplit * 2), 23, 202, null, 0);


        // BOX 5 - [x = 104, y = 110]
        doc.setFillColor(35, 190, 226);
        doc.roundedRect(104, 115, 89, 85, 2, 2, 'F');
        doc.setFontSize(10)
        doc.setTextColor(255, 255, 255)
        doc.text(108, 125, 'To deposit funds to this paper wallet, send the');
        doc.text(108, 130, 'Bitcoin nova (BTN) coins to the public address.');
        doc.text(108, 150, 'DO NOT REVEAL THE PRIVATE SPEND KEY.');
        doc.text(108, 165, 'Until you are ready to import the balance from this');
        doc.text(108, 170, 'wallet to your Bitcoin nova wallet, a cryptocurrency');
        doc.text(108, 175, 'client, or exchange.');
        doc.text(108, 185, 'Amount:');
        doc.setDrawColor(255, 255, 255);
        doc.line(122, 185, 150, 185);
        doc.text(155, 185, 'Date:');
        doc.line(164, 185, 182, 185);
        doc.text(108, 190, 'Notes:');
        doc.line(119, 190, 182, 190);


        // BOX 6 - [x = 203, y = 110]
        doc.addImage(logo, 'PNG', 208, 135, 80, 36.44);


		try {
			doc.save('wallet_backup.pdf');
		} catch(e) {
			alert('Error ' + e);
		}

	}

}
