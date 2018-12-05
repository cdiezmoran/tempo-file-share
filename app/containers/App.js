import * as React from 'react';
import { ipcRenderer } from 'electron';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import jwtDecode from 'jwt-decode';
import { arrayOf, bool, func, object, node } from 'prop-types';
import { userShape } from '../shapes';
import socket, { emit } from '../socketClient';

import notify from '../helpers/notifications';

import { fetchFilesIfNeeded, addFile, removeFile } from '../actions/file';
import { finishDownload, updateDownloadProgress } from '../actions/download';
import { stopWaiting, uploadWithSend } from '../actions/upload';
import { fetchFriendsIfNeeded } from '../actions/friend';
import { fetchFriendRequestsIfNeeded } from '../actions/friendRequest';

import NavBar from '../components/NavBar';
import SendPopUp from '../components/SendPopUp';

const mapStateToProps = ({
  upload: { isWaiting },
  user,
  friend: { friends }
}) => ({
  isWaiting,
  userId: user.id,
  friends
});

const mapDispatchToProps = dispatch => ({
  fetchFiles: () => dispatch(fetchFilesIfNeeded()),
  fetchFriends: () => dispatch(fetchFriendsIfNeeded()),
  fetchFriendRequests: () => dispatch(fetchFriendRequestsIfNeeded()),
  dFinishDownload: fileId => dispatch(finishDownload(fileId)),
  dUpdateDownloadProgress: (fileId, progress) =>
    dispatch(updateDownloadProgress(fileId, progress)),
  dAddFile: file => dispatch(addFile(file)),
  dRemoveFile: index => dispatch(removeFile(index)),
  dStopWaiting: () => dispatch(stopWaiting()),
  dUploadWithSend: send => dispatch(uploadWithSend(send))
});

class App extends React.Component {
  state = {
    user: null
  };

  componentDidMount() {
    const {
      history,
      location: { pathname },
      fetchFiles,
      fetchFriends,
      fetchFriendRequests
    } = this.props;
    const { user } = this.state;
    const token = localStorage.getItem('tempoToken');
    const localConfig = localStorage.getItem('localConfig');

    if (!localConfig)
      localStorage.setItem(
        'localConfig',
        JSON.stringify({
          notifyUpload: true,
          notifyRecieve: true,
          notifyDownload: true
        })
      );

    if (!user && !token && pathname !== '/auth') history.push('/auth');

    if (user || token) {
      const userId = user ? user.id : jwtDecode(token).id;
      emit('userConnection', userId);
      fetchFiles();
      fetchFriends();
      fetchFriendRequests();
    }

    this.setupListeners();
  }

  setupListeners = () => {
    const { dAddFile, dRemoveFile } = this.props;
    const localConfig = JSON.parse(localStorage.getItem('localConfig'));

    ipcRenderer.on('download-progress', this.handleDownloadProgress);
    ipcRenderer.on('download-finish', this.handleDownloadFinish);
    socket.on('recieveFile', file => {
      dAddFile(file);

      if (localConfig.notifyReceived) {
        notify({
          title: 'File Recieved',
          body: `You can now download ${file.name} on this device.`
        });
      }
    });
    socket.on('removeFile', index => {
      dRemoveFile(index);
    });
  };

  handleDownloadProgress = (e, { progress, fileId }) => {
    const { dUpdateDownloadProgress } = this.props;
    dUpdateDownloadProgress(fileId, progress);
  };

  handleDownloadFinish = (e, { fileId, filename }) => {
    const { dFinishDownload } = this.props;
    const localConfig = JSON.parse(localStorage.getItem('localConfig'));

    dFinishDownload(fileId);

    if (localConfig.notifyDownload) {
      notify({
        title: 'Download Complete',
        body: `${filename} has finished downloading.`
      });
    }
  };

  render() {
    const {
      children,
      location: { pathname },
      history,
      isWaiting,
      dStopWaiting,
      dUploadWithSend,
      friends
    } = this.props;
    return (
      <React.Fragment>
        {pathname !== '/settings' && pathname !== '/auth' ? (
          <NavBar pathname={pathname} history={history} />
        ) : null}
        {children}
        <SendPopUp
          display={isWaiting}
          stopWaiting={dStopWaiting}
          uploadWithSend={dUploadWithSend}
          friends={friends}
        />
      </React.Fragment>
    );
  }
}

App.propTypes = {
  children: node.isRequired,
  location: object.isRequired, // eslint-disable-line react/forbid-prop-types
  history: object.isRequired, // eslint-disable-line react/forbid-prop-types
  fetchFiles: func.isRequired,
  dFinishDownload: func.isRequired,
  dUpdateDownloadProgress: func.isRequired,
  dAddFile: func.isRequired,
  dRemoveFile: func.isRequired,
  isWaiting: bool.isRequired,
  dStopWaiting: func.isRequired,
  dUploadWithSend: func.isRequired,
  fetchFriends: func.isRequired,
  fetchFriendRequests: func.isRequired,
  friends: arrayOf(userShape)
};

App.defaultProps = {
  friends: []
};

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(App)
);
