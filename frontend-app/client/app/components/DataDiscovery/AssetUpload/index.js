import React from 'react';
import {
  ModalContainer,
  ModalDialog,
} from 'react-modal-dialog';

const AssetUpload = (props) => {
  const {
    open,
    handleModalClose,
    onFileSelect,
  } = props;

  const UploadModal = (
    <ModalContainer onClose={handleModalClose}>
      <ModalDialog onClose={handleModalClose}>
        <h5>Upload new asset</h5>
        <div
          style={{
            border: '1px solid rgba(0, 0, 0, 0.5)',
            borderRadius: 30,
            padding: '20px 40px',
            margin: 10,
            textAlign: 'center',
            cursor: 'pointer',
          }}
        >
          <label
            htmlFor="files"
            style={{
              textAlign: 'center',
            }}
          >Upload Asset</label>
          <input id="files" style={{ display: 'none' }} type="file" onChange={onFileSelect} />
        </div>
      </ModalDialog>
    </ModalContainer>
  );

  return open ? UploadModal : null;
};

// const mapStateToProps = (state) => {
//   // console.info(state);
//   return {
//     orgUserVerification: state.orgUserVerification,
//   };
// };
export default AssetUpload;
