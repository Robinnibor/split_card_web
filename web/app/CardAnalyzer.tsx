'use client'

import { useRef, useState } from 'react'
import axios from 'axios'
import Image from 'next/image'
import type { NyckelToken } from '@/lib/accessToken';

export default function CardAnalyzer(props: { token: NyckelToken, urls: { nyckel: string; imageProcessingServer: string } }) {
  const fileEl = useRef<HTMLInputElement>(null);
  const imageEl = useRef<HTMLImageElement>(null);
  const [imageSrc, setImageSrc] = useState('');
  const [scaleFactor, setScaleFactor] = useState(0);
  const [originalCardCoords, setOriginalCardCoords] = useState([]);
  const [scaledCardCoords, setScaledCardCoords] = useState([]);
  const [selectedCardIndex, setSelectedCardIndex] = useState(-1);
  const [filteredSearchResults, setFilteredSearchResults] = useState<{ distance: number; externalId: string; data: string; sampleId: string }[]>([]);
  const [searchCache, setSearchCache] = useState<{ [key: number]: { distance: number; externalId: string; data: string; sampleId: string }[] }>({});

  async function getCard(path: string): Promise<void> {
    try {
      const { data } = await axios.post(props.urls.imageProcessingServer + '/get_cards', { image_path: path })
      
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
      const { data } = await axios.post(props.urls.imageProcessingServer + '/upload_image', formData);
  
      await getCard(data.image_path);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Upload image failed.', error);
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
    canvas.width = image.width * scaleFactor;
    canvas.height = image.height * scaleFactor;

    // Draw the original image onto the temporary canvas, doubling its size
    ctx.drawImage(image, 0, 0, image.width * scaleFactor, image.height * scaleFactor);

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
  async function searchCard(index: number, useCache: boolean = true): Promise<{ distance: number; externalId: string; data: string; sampleId: string;  }[] | undefined> {
    if(useCache && searchCache[index]) {
      return searchCache[index];
    }

    const coord = scaledCardCoords[index];
    const data = await cropImage({ x: coord[0], y: coord[1], w: coord[2], h: coord[3] }, imageEl.current!);
    try {
        const res = await axios.post<{ searchSamples: { distance: number; externalId: string; data: string, sampleId: string }[] }>(
        props.urls.nyckel + '/v0.9/functions/sw3j7knfy7fqfko1/search?sampleCount=10&includeData=true',
          { data },
          {
            headers: {
              'Authorization': `${props.token.token_type} ${props.token.access_token}`,
              'Content-Type': 'application/json',
            },
        }
      )
      // TEST: see the most similar samples
      console.log('search results:', res.data.searchSamples);
      const cards = res.data.searchSamples.filter((sample) => sample.distance < 0.035);
      const newCache = { ...searchCache, [index]: cards };
      setSearchCache(newCache);

      return cards;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Search card failed.', error);
      } else {
        console.error('Error searching card:', error);
      }
    }
  }

  async function createCard(selectedCardIndex: number, externalId: string): Promise<any> {
    const coord = scaledCardCoords[selectedCardIndex];
    console.log("index = ", selectedCardIndex)
    const data = await cropImage({ x: coord[0], y: coord[1], w: coord[2], h: coord[3] }, imageEl.current!);
    try {
      const res = await axios.post(
        props.urls.nyckel + '/v1/functions/sw3j7knfy7fqfko1/samples',
          { data, externalId },
          {
            headers: {
              'Authorization': `${props.token.token_type} ${props.token.access_token}`,
              'Content-Type': 'application/json',
            },
        }
      )
      console.log(res.data)
      return res.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // sample with the same externalId already exists
        if (error.response?.status === 409) {
          await createCard(selectedCardIndex, `${externalId}-${Math.floor(Date.now() / 1000)}`);
        } else {
          console.error('Create card failed.', error);
        }
      } else {
        console.error('Error creating card:', error);
      }
    }
  }

  async function deleteCardBySampleId(sampleId: string): Promise<void> {
  try {
    const response = await axios.delete(
      `${props.urls.nyckel}/v1/functions/sw3j7knfy7fqfko1/samples/${sampleId}`,
      {
        headers: {
          'Authorization': `${props.token.token_type} ${props.token.access_token}`,
        },
      }
    )

    console.log(`Status code: ${response.status}`);
    console.log(`Card with sampleId: ${sampleId} has been deleted.`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Delete card by sampleId failed.', error);
    } else {
      console.error('Error deleting card by sampleId:', error);
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
    setSelectedCardIndex(+(e.target as HTMLAreaElement).dataset.index!);
    const cards = await searchCard(+(e.target as HTMLAreaElement).dataset.index!);

    if (cards) {
      setFilteredSearchResults(cards);
    }
  }

  const handleCreateBtnClick: React.MouseEventHandler<HTMLButtonElement> = async () => {
    const json = await createCard(selectedCardIndex, (document.getElementById('create') as HTMLInputElement).value);
    const cards = await searchCard(selectedCardIndex, false);

    if (cards) {
      setFilteredSearchResults(cards);
    }
  }
  // update is the same as create at the moment
  const handleUpdateBtnClick: React.MouseEventHandler<HTMLButtonElement> = async () => {
    const json = await createCard(selectedCardIndex, (document.getElementById('update') as HTMLInputElement).value);
    const cards = await searchCard(selectedCardIndex, false);

    if (cards) {
      setFilteredSearchResults(cards);
    }
  }
  const handleDeleteBtnClick: React.MouseEventHandler<HTMLButtonElement> = async () => {
      try {
        // console.log(filteredSearchResults[0])
        await deleteCardBySampleId(filteredSearchResults[0].sampleId);
        // After deletion, reset the state
        const cards = await searchCard(selectedCardIndex, false);

        if (cards) {
          setFilteredSearchResults(cards);
        }
        //setSelectedCardIndex(-1);
        //setFilteredSearchResults([]);
      } catch (error) {
        console.error('Error deleting card:', error);
      }
  }


  return (
    <main>
  {scaleFactor === 0 && <form method="post" encType="multipart/form-data">
    <div>
      <label htmlFor="file">Choose Image to upload</label>
      <input ref={fileEl} type="file" id="file" name="file" accept="image/*" onChange={handleFileChange} />
    </div>
  </form>}
  {scaleFactor !== 0 && <div className="flex"> {/* Add flex here */}
    <div className="relative">
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
      <Image ref={imageEl} useMap="#cards" src={imageSrc} width={0} height={0} style={{ width: 'auto' }} alt="deck" />
      <div className={`absolute border-2 border-[#00ff00]`} style={{ display: selectedCardIndex === -1 ? 'none' : 'block', left: originalCardCoords[selectedCardIndex]?.[0], top: originalCardCoords[selectedCardIndex]?.[1], width: originalCardCoords[0][2], height: originalCardCoords[0][3] }} />
    </div>
    <div> {/* Move this div to be a sibling of the above div */}
      {filteredSearchResults.length !== 0 && <div>
        <div>
          <label htmlFor="update">Card No:</label>
          <input type="number" id="update" name="update" required />
          <button onClick={handleUpdateBtnClick}>Update</button>
          <button onClick={handleDeleteBtnClick} style={{ marginLeft: '10px' }}>Delete</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Distance</th>
              <th>Data</th>
              <th>Actual</th>
            </tr>
          </thead>
          <tbody>
            {filteredSearchResults.map((result) =>
              <tr key={result.externalId}>
                <td>{result.distance}<br/><br/>{result.externalId}</td>
                <td><Image src={result.data} width={scaledCardCoords[0][2]} height={scaledCardCoords[0][3]} alt="data" /></td>
                <td><Image src={`https://salix5.github.io/query-data/pics/${+result.externalId.split('-')[0]}.jpg`} width={322} height={470} alt="actual" /></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>}
      {filteredSearchResults.length === 0 && selectedCardIndex !== -1 && <div>
        <label htmlFor="create">Card No:</label>
        <input type="number" id="create" name="create" required />
        <button onClick={handleCreateBtnClick}>Create</button>
      </div>}
    </div>
  </div>}
</main>

  )
}
