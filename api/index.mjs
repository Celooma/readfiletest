import express from 'express';
import path from 'path';
import { stat, opendir  } from 'fs/promises';
import { existsSync } from 'fs';
import cors from 'cors';
const app = express();

const port = process.env.PORT || 3000;
let lastDirectory;
let cachedFiles = [];
let pageInfo = {};
app.use(express.json());
app.use(cors());


async function getFiles(dirPath){
  const dir = await opendir(dirPath);
  const files = [];
  for await (const dirent of dir) {
    const fullPath = dirPath + dirent.name;
    const fileAttr = await stat(fullPath);
    const fileInfo = path.parse(fullPath);

    files.push({
      name: dirent.name,
      fileName: fileInfo.name,
      fileExt: fileInfo.ext, 
      isDirectory: dirent.isDirectory(),
      fileAttr,
      fullPath,
      fileInfo
    })
  }
  pageInfo.size = Math.floor(files.length / 20);
  pageInfo.size = (pageInfo.size == 0) ? 1 : pageInfo.size;
  cachedFiles = [...files];
  return files;
}

app.post('/', async (req, res) => {
  const dirPath = req.body.dirPath;
  let pageNumber = ((req.body.pageNumber == 'undefined') ? 1 : req.body.pageNumber);
  let data = [];
  
  if(!existsSync(dirPath)) return res.status(400).send({success: false, message: 'Directory not found',payload: data});
  
    try {
      data = (lastDirectory === dirPath) ? cachedFiles : await getFiles(dirPath);
      lastDirectory = dirPath;
      pageInfo.currentPage = pageNumber;

      //DUMMY PAGINATION displays 20 files per pages
      const chunk = data.filter((el, index) =>  index >= (pageNumber -1) * 20 && index <= pageNumber * 20  );
       return res.status(200).send({success: true, payload: chunk, pageInfo});
      } catch (err) {
        console.log('the err', err);
        return res.status(500).send({success: false, message: err.message, payload: data});

      }
      
   
});

app.listen(port, () => {
    console.log(`I'm listening bro port ${port}`)
  });




