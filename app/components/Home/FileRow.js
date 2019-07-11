import React from 'react';
import moment from 'moment';
import { momentObj } from 'react-moment-proptypes';
import { func, number, string } from 'prop-types';
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
  index
}) => {
  const handleDownload = () => {
    analytics.send('event', {
      ec: 'File-El',
      ea: 'download',
      el: `Download file ${id}`
    });
    downloadFile(id, s3Filename, filename);
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

      removeFile(index);
      emit('removeFileFromRoom', { roomId: userId, index });

      analytics.send('event', {
        ec: 'File-El',
        ea: 'delete',
        el: 'Delete file'
      });
    } catch (exception) {
      console.error(`[FileRow.handleDelete] ${exception.message}`);
    }
  };

  const fileIcon = getFileIcon(filename);

  return (
    <div className={styles.item}>
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
        </div>
        <div
          className={styles.innerSquare}
          style={{ backgroundColor: fileIcon.color }}
        />
        <i
          className={`${styles.centerIcon} ${fileIcon.icon}`}
          style={{ color: fileIcon.color }}
        />
      </div>
      <div>
        <p className={styles.name}>{filename}</p>
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
  userId: string.isRequired,
  s3Filename: string.isRequired
};

export default FileRow;
