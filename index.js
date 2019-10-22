import './index.css';

import {h, Component, render} from 'preact';
import { Router, route, Link} from 'preact-router';
import uuidv1 from 'uuid/v1';
import {format} from 'date-fns';
import classnames from 'classnames';
import Portal from 'preact-portal';
import { createHashHistory } from 'history';
/** @jsx h */


const BASE_URL = '/track-ip-timer';

console.log(">>>", ('serviceWorker' in navigator));
if ('serviceWorker' in navigator) {
  // Use the window load event to keep the page load performant
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js');
  });
}

function debugPrintActivities () {
  return JSON.parse(window.localStorage.getItem('activities'))
}

function getDuration (splits) {
  const ms = splits[splits.length-1] - splits[0];
  return (ms / 1000).toFixed(1);
}

function getDurationMins (splits) {
  const ms = splits[splits.length-1] - splits[0];
  return format(ms, 'mm:ss');
}

function lpad (str, len) {
  while (str.length < len) {
    str = "0"+str;
  }
  return str;
}

function formatTime(ms) {
  if (Number.isNaN(ms)) {
    return "";
  }

  const seconds = Math.floor(ms / 1000);
  const secondsStr = String(seconds);
  const msCapped = lpad(String(ms % 1000), 3).slice(0, 1);
  const secondsLastDidget = secondsStr.slice(secondsStr.length-1);
  const secondsNotLastDidget = secondsStr.slice(0, secondsStr.length-1);

  return (
    <div>
      <span class="not-last-second">
        {secondsNotLastDidget}
      </span>
      <span class="last-second">
        {secondsLastDidget}
      </span>
      <span class="ms-tenth">
        .{msCapped}
      </span>
    </div>
  );
}


class Modal extends Component {
  render () {
    return (
      <div className="Modal__container">
        <div className="Modal">
          {this.props.children}
        </div>
      </div>
    );
  }
}

class IconBase extends Component {
  render () {
    const {size, className} = this.props;
    const style = {
      ...this.props.style,
      width: size || "1em",
      height: size || "1em",
    };

    return (
      <svg
        viewBox="0 0 24 24"
        style={style}
        className={classnames('Icon', className)}
      >
        {this.props.children}
      </svg>
    );
  }
}

class IconArrow extends Component {
  render () {
    return (
      <IconBase {...this.props}>
        <path fill="#000000" d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" />
      </IconBase>
    );
  }
}

class IconSave extends Component {
  render () {
    return (
      <IconBase {...this.props}>
        <path fill="#000000" d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
      </IconBase>
    );
  }
}

class IconAdd extends Component {
  render () {
    return (
      <IconBase {...this.props}>
        <path fill="#000000" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
      </IconBase>
    );
  }
}

class IconClose extends Component {
  render () {
    return (
      <IconBase {...this.props}>
        <path fill="#000000" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
      </IconBase>
    );
  }
}

class IconCycle extends Component {
  render () {
    return (
      <IconBase {...this.props}>
        <path d="M5,20.5A3.5,3.5 0 0,1 1.5,17A3.5,3.5 0 0,1 5,13.5A3.5,3.5 0 0,1 8.5,17A3.5,3.5 0 0,1 5,20.5M5,12A5,5 0 0,0 0,17A5,5 0 0,0 5,22A5,5 0 0,0 10,17A5,5 0 0,0 5,12M14.8,10H19V8.2H15.8L13.86,4.93C13.57,4.43 13,4.1 12.4,4.1C11.93,4.1 11.5,4.29 11.2,4.6L7.5,8.29C7.19,8.6 7,9 7,9.5C7,10.13 7.33,10.66 7.85,10.97L11.2,13V18H13V11.5L10.75,9.85L13.07,7.5M19,20.5A3.5,3.5 0 0,1 15.5,17A3.5,3.5 0 0,1 19,13.5A3.5,3.5 0 0,1 22.5,17A3.5,3.5 0 0,1 19,20.5M19,12A5,5 0 0,0 14,17A5,5 0 0,0 19,22A5,5 0 0,0 24,17A5,5 0 0,0 19,12M16,4.8C17,4.8 17.8,4 17.8,3C17.8,2 17,1.2 16,1.2C15,1.2 14.2,2 14.2,3C14.2,4 15,4.8 16,4.8Z" />
      </IconBase>
    );
  }
}


class ViewList extends Component {

  onDestroy (activity) {
    const {actions} = this.props;
    if (window.confirm("Destroy activity?")) {
      actions.destroy(activity);
    }
  }

  onNew (e) {
    e.preventDefault();
    const activity = this.props.actions.create();
    route(`/activity/${activity.id}`);
  }

  render() {
    const {activities, actions} = this.props;

    const sortedActivities = activities.sort((a, b) => {
      const aTs = a.createdAt;
      const bTs = b.createdAt;
      if (aTs < bTs) {
        return 1;
      }
      else if (aTs > bTs) {
        return -1;
      }
      else {
        return 0;
      }
    });

    // console.log("sortedActivities", sortedActivities);

    return <div className="Home">
      <header className="Home__header">
        <h1>Activities</h1>
        <p>
          List of efforts
        </p>
      </header>
      <div className="activities">
        <div key="new" className="activity activity--new">
          <IconAdd className="activity__icon" size="1.2em" />
          <a href="#" onClick={(e) => this.onNew(e)}>
            Start new
          </a>
        </div>
        {sortedActivities.map(activity => {
          return <div key={`activity-${activity.id}`} className="activity">
            <IconCycle className="activity__icon" size="1.2em" />
            <div className="activity__title">
              <a href={`/activity/${activity.id}`}>
                {activity.title}
              </a>
              {activity.splits.length > 1 &&
                <span> &ndash; {getDurationMins(activity.splits)}</span>
              }
              <time className="activity__time">
                {activity.splits.length > 0 &&
                  format(activity.splits[0], "YYYY-MM-DD HH:mm:ss")
                }
                {activity.splits.length < 1 &&
                  "Not started"
                }
              </time>
            </div>
            <div className="activity__toolbox">
              <button onClick={() => this.onDestroy(activity)}>
                <IconClose />
              </button>
            </div>
          </div>
        })}
      </div>
    </div>;
  }
}

function px (val) {
  return `${val}px`;
}

class ViewTimer extends Component {
  constructor (props) {
    super();
    this.onResize = this.onResize.bind(this);

    this.state = {
      now: Date.now(),
      started: false,
      sidebarVisible: true,
      timeElSize: {},
      modalActive: false,
    };

    this.onStart = this.onStart.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onStop = this.onStop.bind(this);
    this.onUndo = this.onUndo.bind(this);
    this.onToggle = this.onToggle.bind(this);
    this.onToggleFullscreen = this.onToggleFullscreen.bind(this);
    this.onShare = this.onShare.bind(this);
    this.onCancelModal = this.onCancelModal.bind(this);
    this.onBackToResults = this.onBackToResults.bind(this);
  }

  getActivity () {
    return this.props.activities.find(activity => {
      return activity.id === this.props.id;
    });
  }

  onBackToResults () {
    this.setState({
      modalActive: false,
    });
    route(`/`);
  }

  onCancelModal () {
    // console.log("cancel", this.state.modalActive)
    this.setState({
      modalActive: !this.state.modalActive
    });
  }

  onUndo (e) {
    const activity = this.getActivity();
    this.setState({started: true});
    activity.splits.pop();
    this.props.actions.update(activity);
  }

  onStart (e) {
    // console.log("onStart");
    const activity = this.getActivity();

    // console.log(">>", this.state.started, activity.splits.length)
    // if (!this.state.started && activity.splits.length > 0) {
    //   console.log("just start");
    //   activity.splits.pop();
    //   this.setState({started: true});
    //   return;
    // }

    const timeStamp = Math.min(
      Date.now(),
      // Math.floor(
      //   window.performance.timing.navigationStart+e.timeStamp
      // ),
    );

    this.setState({started: true});

    activity.splits.push(timeStamp);
    this.props.actions.update(activity);
  }

  updateNow () {
    this.setState({
      now: Date.now()
    });
  }

  componentDidMount () {
    this.hdl = setInterval(this.updateNow.bind(this), 1000/60);
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    this.resizeTimeText();

    this.setState({
      isStandalone: ("standalone" in window.navigator)
    });
  }

  resizeTimeText () {
    const bb = this.timeEl.getBoundingClientRect();
    this.setState({
      timeElSize: bb,
    });
  }

  onKeyDown (e) {
    if (e.code === "Space") {
      e.preventDefault();
      e.stopPropagation();
      this.onStart(e);
    }
    else if (e.code === "KeyT") {
      this.onToggle();
    }
    else if (e.code === "KeyU") {
      this.onUndo();
    }
    else if (e.code === "KeyF") {
      this.onToggleFullscreen();
    }
  }

  componentWillUnmount () {
    clearInterval(this.hdl);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
  }

  onResize () {
    this.resizeTimeText();
  }

  onStop (e) {
    this.setState({
      started: false,
      modalActive: true,
    });
  }

  onToggleFullscreen (e) {
    // console.log("onToggle");
    if (!document.fullscreenElement) {
      document.body.requestFullscreen();
    } else if (document.exitFullscreen) {
      document.exitFullscreen(); 
    }
  }

  isSharingEnabled () {
    return !!window.navigator.share;
  }

  onShare () {
    const activity = this.getActivity();
    const {id, createdAt, title, splits} = activity;
    const shareObj = {
      title,
      url: `${window.location.origin}/view?id=${id}&createdAt=${createdAt}&title=${title}&splits=${splits.join(",")}`
    };

    if (this.isSharingEnabled()) {
      window.navigator.share(shareObj);
    }
    else {
      alert(shareObj.url);
    }
  }

  onToggle (e) {
    this.setState({
      sidebarVisible: !this.state.sidebarVisible,
    }, () => {
      setTimeout(() => {
        setTimeout(() => {
          this.onResize();
        }, 10);
      }, 10);
    });

    // Not great but better for track visibility
    e.target.blur();
  }

  deactivateModal () {
    console.log("exit")
  }

  getApplicationNode () {
    return document.body;
  }

  render () {
    const {timeElWidth, timeElHeight, isStandalone} = this.state;
    const {id} = this.props;
    const {now, timeElSize} = this.state;
    const activity = this.getActivity();
    const sidebarVisible = this.state.sidebarVisible;
    const isStarted = activity.splits.length > 1;

    const mainTextSize = 0.55 * timeElSize.width || 300;

    let hidePrevTimeSplit = sidebarVisible;
    let inQuietTime = false;
    let currentSplit;
    if (this.state.started) {
      const currentSplitRaw = now - activity.splits[activity.splits.length-1]
      currentSplit = formatTime(currentSplitRaw);

      inQuietTime = activity.splits[activity.splits.length-1] + 1800 > now &&
        activity.splits.length > 1;
      hidePrevTimeSplit = sidebarVisible || inQuietTime;
    }

    return <div className={`timer ${sidebarVisible ? 'js-sidebar-open' : ''}`}>
      {this.state.modalActive &&
        <Portal into="body">
          <Modal>
            <div className="Modal__time-msg">
              {getDurationMins(activity.splits)}
            </div>
            <div className="Modal__message">
              Well done that was outrageous!
            </div>
            <div className="Modal__toolbox">
              <button className="Button" id="close-modal" onClick={this.onCancelModal}>
                Cancel
              </button>
              <button className="Button" onClick={this.onBackToResults}>
                Back to results
              </button>
            </div>
          </Modal>
        </Portal>
      }
      <div className={`timer__details timer__details--${!sidebarVisible ? 'hide' : ''}`}>
        <div className="timer__details__title">
          <input
            type="text"
            value={activity.title}
            onInput={(e) => {
              console.log(">>>>", e.target.value);
              this.props.actions.update({...activity, title: e.target.value});
            }}
          />
        </div>
        <div className="timer__details__splits">
          {this.state.started &&
          <div className="timer__details__splits__split">
            <div className="timer__details__splits__split--label">
              Lap {activity.splits.length}
            </div>
            <div className="timer__details__splits__split--time">
              {currentSplit}
            </div>
          </div>
          }
          {activity.splits.map((split, idx) => {
            if (idx === 0) {
              return;
            }
            else {
              return  (
                <div className="timer__details__splits__split">
                  <div className="timer__details__splits__split--label">
                    Lap {idx}
                  </div>
                  <div className="timer__details__splits__split--time">
                    {formatTime(
                      split - activity.splits[idx-1]
                    )}
                  </div>
                </div>
              );
            }
          }).filter(Boolean).reverse()}
        </div>
        <div className="timer__details__buttons">
          <button
            onClick={this.onStart}
            className="Button"
          >
            Start/split
          </button>
          <button
            onClick={this.onStop}
            disabled={!isStarted}
            className="Button"
          >
            End effort
          </button>
          <button
            onClick={this.onUndo}
            disabled={!isStarted}
            className="Button"
          >
            Undo
          </button>
          <button
            onClick={this.onToggleFullscreen}
            className={`Button ${isStandalone ? 'hide' : ''}`}
          >
            Fullscreen
          </button>
        </div>
      </div>
      <div
        className="timer__prev-time"
        ref={(el) => this.timeEl = el}
        style={{fontSize: mainTextSize}}
      >
        <div className="background-split-button"
          onClick={this.onStart}
        ></div>
        <div className="prev-container">
          <button
            onClick={this.onToggle}
            className={`timer__prev-time__toggle timer__prev-time__toggle--${sidebarVisible ? 'open' : 'close'} timer__prev-time__toggle--${inQuietTime ? 'quiet' : 'loud'}`}
          >
            <IconArrow />
          </button>
        </div>
        <span>{formatTime(
          activity.splits[activity.splits.length-1] - activity.splits[activity.splits.length-2]
        )}
        </span>
        <div class={`timer__prev-time__current-split ${hidePrevTimeSplit ? 'hide': ''}`}>
          {currentSplit}
          <div>Laps {activity.splits.length-1}</div>
        </div>
      </div>
    </div>
  }
}

window.clear = function() {
  window.localStorage.clear();
}

let idx = 0;

class App extends Component {

  constructor () {
    super();

    // HACK
    idx++;
    if (idx > 1000) {
      throw "ARRGH"
    }

    this.state = {
      activities: JSON.parse(
        window.localStorage.getItem('activities') || "[]"
      )
    };

    const save = () => {
      window.localStorage.setItem(
        'activities',
        JSON.stringify(this.state.activities)
      )
    }

    const load = () => {
      this.setState({
        activities: JSON.parse(
          window.localStorage.getItem('activities') || "[]"
        )
      })
    }

    window.addEventListener('storage', load);

    this.actions = {
      destroy: (activity) => {
        const {activities} = this.state;
        const updatedActivities = activities.filter(_activity => {
          return activity.id !== _activity.id;
        });

        this.setState({activities: updatedActivities});
        save();
      },
      update: (updateActivity) => {
        const {activities} = this.state;
        const idx = activities.findIndex(_activity => {
          return updateActivity.id === _activity.id;
        });
        activities[idx] = updateActivity;
        this.setState({activities});
        save();
      },
      create: () => {
        const {activities} = this.state;
        const createdAt = Date.now();
        const activity = {
          id: uuidv1(),
          createdAt,
          title: 'Effort',
          splits: [],
        };
        activities.push(activity);
        this.setState({activities});
        save();
        return activity;
      }
    }
  }

  render() {
    return (
      <Router history={createHashHistory()}>
        <ViewList path={`/`} {...this.state} actions={this.actions} />
        <ViewTimer path={`/activity/:id`} {...this.state} actions={this.actions} />
      </Router>
    );
  }

}


// render an instance of Clock into <body>:
render(<App />, document.body);

