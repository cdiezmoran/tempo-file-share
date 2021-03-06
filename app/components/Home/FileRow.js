import React from 'react';
import { shell } from 'electron';
import moment from 'moment';
import fs from 'fs';
import { momentObj } from 'react-moment-proptypes';
import { bool, func, number, oneOfType, shape, string } from 'prop-types';
import styles from './FileRow.scss';

import callApi from '../../helpers/apiCaller';
import { getFileIcon } from '../../helpers/file';
import analytics from '../../helpers/analytics';
import { emit } from '../../socketClient';

const FileRow = ({
  downloadFile,
  filename,
  expiresAt,
  id,
  s3Filename,
  userId,
  removeFile,
  removeSentFile,
  index,
  dlFiles,
  removeDlPath,
  from,
  sent
}) => {
  const handleDownload = () => {
    analytics.send('event', {
      ec: 'File-El',
      ea: 'download',
      el: `Download file ${id}`
    });
    downloadFile(id, s3Filename, filename);
  };

  const handleOpen = () => {
    if (dlFiles[id] && fs.existsSync(dlFiles[id].savePath))
      shell.openItem(dlFiles[id].savePath);
    else handleDownload();
  };

  const deleteFile = async () => {
    try {
      const response = await callApi(`${userId}/files/${id}`, {}, 'DELETE');
      const { message, shouldDeleteS3 } = await response.json();

      if (message) throw new Error(message);

      return shouldDeleteS3;
    } catch (exception) {
      throw new Error(`[FileRow.deleteFile] ${exception.message}`);
    }
  };

  const handleDelete = async () => {
    try {
      const shouldDeleteS3 = await deleteFile();

      if (shouldDeleteS3) {
        await callApi('delete-s3', { filename: s3Filename }, 'POST');
      }

      removeFile(id);
      removeSentFile(id);
      removeDlPath(id);
      emit('removeFileByIdFromRoom', { roomId: userId, id });
      emit('removeSentFileFromRoom', { roomId: userId, id });

      analytics.send('event', {
        ec: 'File-El',
        ea: 'delete',
        el: 'Delete file'
      });
    } catch (exception) {
      console.error(`[FileRow.handleDelete] ${exception.message}`);
    }
  };

  const formatFilename = () => {
    const parts = filename.split('.');
    const extension = `.${parts.pop()}`;
    const formattedName = parts.join('');
    return { formattedName, extension };
  };

  const { formattedName, extension } = formatFilename();
  const fileIcon = getFileIcon(filename);

  return (
    <div
      className={styles.item}
      style={{ marginRight: (index + 1) % 3 === 0 ? '0' : '18px' }}
    >
      <div className={styles.square}>
        <div className={styles.overlay}>
          <div className={styles.overlayCol}>
            <button
              type="button"
              className={styles.downloadButton}
              onClick={handleDownload}
            >
              <i className="fas fa-long-arrow-alt-down" />
            </button>
            Download
          </div>
          {!sent ? (
            <div className={styles.overlayCol}>
              <button
                type="button"
                className={styles.deleteButton}
                onClick={handleDelete}
              >
                <i className="far fa-trash-alt" />
              </button>
              Delete
            </div>
          ) : null}
        </div>
        <div
          className={styles.innerSquare}
          style={{ backgroundColor: fileIcon.color }}
        />
        <i
          className={`${styles.centerIcon} ${fileIcon.icon}`}
          style={{ color: fileIcon.color }}
        />
        {typeof from === 'object' && from._id !== userId ? (
          <p className={styles.sentBy} style={{ color: fileIcon.color }}>
            Sent by {from.username}
          </p>
        ) : null}
      </div>
      <div
        onClick={handleOpen}
        role="button"
        tabIndex={0}
        onKeyUp={() => {}}
        style={{ outline: 'none' }}
      >
        <div className={styles.filename}>
          <p className={styles.name}>{formattedName}</p>
          <p className={styles.extension}>{extension}</p>
        </div>
        <p className={styles.expiry}>Expires {moment().to(expiresAt)}</p>
      </div>
    </div>
  );
};

FileRow.propTypes = {
  downloadFile: func.isRequired,
  expiresAt: momentObj.isRequired,
  filename: string.isRequired,
  id: string.isRequired,
  index: number.isRequired,
  removeFile: func.isRequired,
  removeSentFile: func.isRequired,
  userId: string.isRequired,
  s3Filename: string.isRequired,
  removeDlPath: func.isRequired,
  sent: bool.isRequired,
  dlFiles: shape({ fileID: string }).isRequired,
  from: oneOfType([
    string,
    shape({
      _id: string,
      username: string
    })
  ]).isRequired
};

export default FileRow;
