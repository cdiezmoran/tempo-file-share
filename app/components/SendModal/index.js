import React, { useEffect, useState } from 'react';
import { arrayOf, bool, func, string } from 'prop-types';
import { userShape } from '../../shapes';
import styles from './styles.scss';

import { validateEmail } from '../../helpers/string';

import Friends from './FriendsTab';
import Emails from './EmailTab';

const SendModal = ({
  stopWaiting,
  friends,
  userID,
  display,
  uploadFiles,
  uploadLink,
  recentEmails,
  fetchRecentEmails,
  updateRecentEmails
}) => {
  const [error, setError] = useState('');
  const [emails, setEmails] = useState([]);
  const [currentEmail, setCurrentEmail] = useState('');
  const [selectedFriends, setSelectedFriends] = useState({});
  const [tab, setActiveTab] = useState(0);
  const sendActive =
    (tab === 0 && Object.keys(selectedFriends).length > 0) ||
    (tab === 1 && (emails.length > 0 || validateEmail(currentEmail)));

  useEffect(() => {
    if (userID) fetchRecentEmails();
  }, [userID]);

  const resetState = () => {
    setSelectedFriends({});
    setCurrentEmail('');
    setEmails([]);
  };

  const handleBack = () => {
    stopWaiting();
    resetState();
  };

  const handleLink = () => {
    uploadLink({ from: userID }, true);
    resetState();
  };

  const handleSend = () => {
    const finalEmails =
      tab === 1 && validateEmail(currentEmail)
        ? [...emails, currentEmail]
        : emails;
    const to = tab === 0 ? Object.keys(selectedFriends) : finalEmails;
    const addToUser = selectedFriends[userID] === 1;

    const send = {
      to,
      from: userID
    };

    if (tab === 0) uploadFiles(send, addToUser);
    else if (tab === 1) {
      uploadLink(send);
      updateRecentEmails(finalEmails);
    }

    resetState();
  };

  const handleKeyDown = ({ key }) => {
    if (key === 'Enter' || key === ' ') {
      if (!validateEmail(currentEmail)) {
        setError('Invalid email');
      } else {
        const newEmails = [...emails, currentEmail];
        setEmails(newEmails);
        setCurrentEmail('');
      }
    }
  };

  const removeEmail = email => () => {
    const newEmails = [...emails];
    const index = emails.indexOf(email);

    newEmails.splice(index, 1);
    setEmails(newEmails);
  };

  const addEmail = email => () => {
    const newEmails = [email, ...emails];
    setEmails(newEmails);
  };

  const handleEmailChange = ({ target: { value } }) => {
    setError('');
    setCurrentEmail(value.trim());
  };

  const handleSelect = id => () => {
    const containsID = Object.prototype.hasOwnProperty.call(
      selectedFriends,
      id
    );

    let newSelectedFriends;

    if (containsID) {
      newSelectedFriends = { ...selectedFriends };
      delete newSelectedFriends[id];
    } else {
      newSelectedFriends = { ...selectedFriends, [id]: 1 };
    }

    setSelectedFriends(newSelectedFriends);
  };

  const renderTabs = () => {
    switch (tab) {
      case 0:
        return (
          <Friends
            friends={friends}
            selectedFriends={selectedFriends}
            select={handleSelect}
            userID={userID}
          />
        );
      case 1:
        return (
          <Emails
            currentEmail={currentEmail}
            emails={emails}
            handleEmailChange={handleEmailChange}
            handleKeyDown={handleKeyDown}
            removeEmail={removeEmail}
            addEmail={addEmail}
            error={error}
            recentEmails={recentEmails}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ zIndex: display ? 15 : -1 }}>
      <div
        className={styles.overlay}
        style={{ display: display ? 'block' : 'none' }}
      />
      <div className={styles.sendModal} style={{ bottom: display ? 0 : -560 }}>
        <div className={styles.top}>
          <div className={styles.left}>
            <button type="button" className={styles.close} onClick={handleBack}>
              <i className="fa fa-times" />
            </button>
          </div>
          <p>Send To</p>
          <div className={styles.right}>
            <button type="button" className={styles.clip} onClick={handleLink}>
              <i className="fas fa-paperclip" />
            </button>
            <button
              type="button"
              className={`${styles.send} ${sendActive ? styles.active : ''}`}
              onClick={handleSend}
              disabled={!sendActive}
            >
              <i className="far fa-paper-plane" />
            </button>
          </div>
        </div>
        <div className={styles.tabSelect}>
          <button
            type="button"
            className={tab === 0 ? styles.tabActive : {}}
            onClick={() => setActiveTab(0)}
          >
            Friends
            {Object.keys(selectedFriends).length > 0 && tab === 0 ? (
              <div className={styles.badge}>
                {Object.keys(selectedFriends).length}
              </div>
            ) : null}
          </button>
          <button
            type="button"
            className={tab === 1 ? styles.tabActive : {}}
            onClick={() => setActiveTab(1)}
          >
            Email
          </button>
        </div>
        {renderTabs()}
      </div>
    </div>
  );
};

SendModal.propTypes = {
  friends: arrayOf(userShape),
  stopWaiting: func.isRequired,
  userID: string,
  display: bool.isRequired,
  uploadFiles: func.isRequired,
  uploadLink: func.isRequired,
  recentEmails: arrayOf(string),
  fetchRecentEmails: func.isRequired,
  updateRecentEmails: func.isRequired
};

SendModal.defaultProps = {
  friends: [],
  recentEmails: [],
  userID: ''
};

export default SendModal;
