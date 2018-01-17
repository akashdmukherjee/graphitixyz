
export const randomId = () => Math.random().toString(16).slice(2);

export const base64ToBlob = (b64Data, sliceSize=512) => {
  const contentTypePattern = /^data:(.*);base64/;
  const contentType = contentTypePattern.exec(b64Data)[1];
  const byteCharacters = atob(b64Data.replace(/^data:text\/\w+;base64,/, ''));
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  const blob = new Blob(byteArrays, { type: contentType });
  return blob;
};
