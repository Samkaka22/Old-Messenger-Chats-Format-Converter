# Old Messenger chats format converter

## Introduction 
As per the newer Meta rules, the download of chat information now occurs in the format of .json files. Whereas before 2024, the Metadata (messenger chats) download was in .HTML file format and was very user friendly.
Therefore, as the newer format was a bit hard to understand and not so user friendly I decided to come up with this project for my own cause. However, I thought it would also benefit others and hence I decided to share it with you all.

## Requirements
- Python IDE ( Visual Code Studio or similar)
- Zip Extractor

## Steps to Follow

### Step 1 (Downloading the necessary data from Meta)
Download the necessary chat data by requesting it from your messenger account. It will appear in the form of a .Zip file.

<details>
<summary>How to download data from messenger</summary>

<img width="426" height="480" alt="image" src="https://github.com/user-attachments/assets/c355d876-0aee-4501-95ce-9c209877d80f" />


</details>

> [!NOTE]
> Check out for further changes as per **Meta** updates

### Step 2 (Using the code)
- **Copy** the code from [main.py](https://github.com/Samkaka22/Old-Messenger-Chats-Format-Converter/blob/63470d10047172e720be01255aede785a620bcf1/main.py) 
- Type the following command in the **_Terminal_** for **All Files**
  ```
  python main.py
  ```
  >This will transform all the .json files into .HTML file format present within the downloaded folder.
- Type the following command in the **_Terminal_** for **Single File** 
   ```
  python main.py <file name>.json
  ```
>> If you want to view the media files within your downloaded .HTML file, it is important to follow the conversion process of .json files within the same folder where the media folder is present after extraction. _Otherwise the media won't be displayed after conversion in the .HTML file_

   
> [!NOTE]
> I did this project for my personal use. Hope it helps you as well :slightly_smiling_face:    

> [!TIP]
> If you want to avoid the struggle of offline conversion, you can check out the browser viewer version done by [SadBios](https://github.com/SadBIOS), which is :point_right: [Stateless Meta JSON Viewer](https://github.com/SadBIOS/Stateless-Meta-JSON-Viewer.git) 
