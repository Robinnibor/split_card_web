'use client'

import { useRef, useState } from 'react'
import axios from 'axios'
import Image from 'next/image'
import type { NyckelToken } from '@/lib/accessToken';

const deck = {
  width: 448,
  height: 640,
}

export default function CardAnalyzer(props: NyckelToken) {
  const fileEl = useRef<HTMLInputElement>(null);
  const imageEl = useRef<HTMLImageElement>(null);
  const [imageSrc, setImageSrc] = useState('');
  const [scaleFactor, setScaleFactor] = useState(0);
  const [originalCardCoords, setOriginalCardCoords] = useState([]);
  const [scaledCardCoords, setScaledCardCoords] = useState([]);
  const [selectedCardIndex, setSelectedCardIndex] = useState(-1);
  const [cardNum, setCardNum] = useState('');

  async function getCard(path: string): Promise<void> {
    try {
      const { data } = await axios.post('/api/card', { image_path: path })
      
      setScaleFactor(data.scale_factor);
      setOriginalCardCoords(data.original_cards);
      setScaledCardCoords(data.scaled_cards);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Get card failed.', error);
      } else {
        console.error('Error getting card:', error);
      }
    }
  }
  async function uploadImage(file: File): Promise<void> {
    const formData = new FormData();
    formData.append('image', file);
    setImageSrc(URL.createObjectURL(file));
    try {
      const { data } = await axios.post('/api/upload', formData);
  
      await getCard(data.image_path);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Get card failed.', error);
      } else {
        console.error('Error uploading image:', error);
      }
    }
  }
  async function cropImage({ x, y, w, h }: { x: number; y: number; w: number; h: number},image: HTMLImageElement): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    // Set the cropping coordinates on the original image
    const cropX = x;
    const cropY = y;
    const cropWidth = w;
    const cropHeight = h;

    // Set the dimensions of the temporary canvas to accommodate the doubled size
    canvas.width = deck.width * scaleFactor;
    canvas.height = deck.height * scaleFactor;

    // Draw the original image onto the temporary canvas, doubling its size
    ctx.drawImage(image, 0, 0, deck.width * scaleFactor, deck.height * scaleFactor);

    // Create a new canvas to store the cropped image
    const croppedCanvas = document.createElement('canvas');
    const croppedCtx = croppedCanvas.getContext('2d')!;

    // Set the dimensions of the new canvas
    croppedCanvas.width = cropWidth;
    croppedCanvas.height = cropHeight;

    // Draw the cropped region onto the new canvas from the doubled-size canvas
    croppedCtx.drawImage(canvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

    // Get the data URL of the cropped image
    return croppedCanvas.toDataURL();
  }
  async function searchCard(data: string): Promise<string | undefined> {
    try {
      const res = await axios.post(
        process.env.NEXT_PUBLIC_NYCKEL_URL + '/v0.9/functions/sw3j7knfy7fqfko1/search',
          { data },
          {
            headers: {
              'Authorization': `${props.token_type} ${props.access_token}`,
              'Content-Type': 'application/json',
            },
        }
      )
      const card = res.data.searchSamples[0];

      if (card.distance < 0.1 && card.externalId) {
        return card.externalId;
      }

      return undefined;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Search card failed.', error);
      } else {
        console.error('Error searching card:', error);
      }
    }
  }
  async function createCard(data: string, externalId: string): Promise<any> {
    try {
      const res = await axios.post(
        process.env.NEXT_PUBLIC_NYCKEL_URL + '/v1/functions/sw3j7knfy7fqfko1/samples',
          { data, externalId },
          {
            headers: {
              'Authorization': `${props.token_type} ${props.access_token}`,
              'Content-Type': 'application/json',
            },
        }
      )

      return res.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Create card failed.', error);
      } else {
        console.error('Error creating card:', error);
      }
    }
  }

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = () => {
    const file = fileEl.current?.files?.[0];
    
    if (file) {
      uploadImage(file);
    }
  }
  const handleMapClick: React.MouseEventHandler<HTMLMapElement> = async (e) => {
    const coord = scaledCardCoords[+(e.target as HTMLAreaElement).dataset.index!];
    const dataUrl = await cropImage({ x: coord[0], y: coord[1], w: coord[2], h: coord[3] }, imageEl.current!);
    const externalId = await searchCard(dataUrl);

    setSelectedCardIndex(+(e.target as HTMLAreaElement).dataset.index!);

    if (externalId) {
      setCardNum(externalId);
    } else {
      setCardNum('');
    }
  }
  const handleBtnClick: React.MouseEventHandler<HTMLButtonElement> = async () => {
    const coord = scaledCardCoords[selectedCardIndex];
    const dataUrl = await cropImage({ x: coord[0], y: coord[1], w: coord[2], h: coord[3] }, imageEl.current!);
    const json = await createCard(dataUrl, (document.getElementById('number') as HTMLInputElement).value);
    const externalId = await searchCard(json.data);

    setCardNum(externalId!);
  }

  return (
    <main>
      {scaleFactor === 0 && <form method="post" encType="multipart/form-data">
        <div>
          <label htmlFor="file">Choose Image to upload</label>
          <input ref={fileEl} type="file" id="file" name="file" accept="image/*" onChange={handleFileChange} />
        </div>
      </form>}
      {scaleFactor !== 0 && <div>
        <map name="cards" onClick={handleMapClick}>
          {originalCardCoords.map((coord, i) => <area
            key={i}
            data-index={i}
            shape="rect"
            coords={`${coord[0]},${coord[1]},${coord[0] + coord[2]},${coord[1] + coord[3]}`}
            href={`#${i}`}
            alt="card"
          />)}
        </map>
        <Image ref={imageEl} useMap="#cards" src={imageSrc} width={deck.width} height={deck.height} alt="preview" />
        {cardNum && <div>Card No. {cardNum}</div>}
        {!cardNum && selectedCardIndex !== -1 && <div>
          <label htmlFor="number">Card No:</label>
          <input type="number" id="number" name="number" required />
          <button onClick={handleBtnClick}>Submit</button>
        </div>}
      </div>}
    </main>
  )
}
