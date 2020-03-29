/* @jsx h */
import 'mapbox-gl/dist/mapbox-gl.css'
import './index.css';

import {h, Component, render} from 'preact';
import { Router, route, Link} from 'preact-router';
import classnames from 'classnames';
import Portal from 'preact-portal';
import { createHashHistory } from 'history';
import mapboxgl from 'mapbox-gl';

import 'ol/ol.css'
import olms from 'ol-mapbox-style';
import {Map as OlMap, View as OlView} from 'ol';


const modules = {};
var paths = require.context('./styles', true, /.json$/);
paths.keys().forEach(function(path) {
  if (path.match(/\.\/_/)) {
    modules[path] = undefined;
  }
  else {
    modules[path] = paths(path);
  }
});

function clone (obj) {
  return JSON.parse(JSON.stringify(obj));
}


const styles = Object.keys(modules).map(path => {
  return {
    id: path.replace(/^\.\/|\.json$/g, ""),
    path: path,
    style: modules[path],
  }
}).sort((a, b) => {
  let n=0;
  if (a.id < b.id) { n-=1 }
  if (a.id > b.id) { n+=1 }
  if (!a.style && b.style) { n+=10 }
  if (a.style && !b.style) { n-=10 }
  return n;
});


class OpenLayersMapIframe extends Component {
  constructor (props) {
    super(props);
    this.onChange = this.onChange.bind(this);
    this.showMap = this.showMap.bind(this);
    this.state = {
      url: ""
    }
  }

  showMap () {
    const loc = window.location;
    const olUrl = `${loc.origin}${loc.pathname}#/ol/?style=${this.props.style}`;
    this.setState({
      url: olUrl,
    });
  }

  destroyMap () {
    this.setState({
      url: "",
    });
  }

  onChange (entries, observer) {
    if (entries[0].intersectionRatio) {
      this.showMap();
    }
    else {
      this.destroyMap();
    }
  }

  componentDidMount () {
    this._observer = new IntersectionObserver(this.onChange);
    this._observer.observe(this._el);
  }

  componentWillUnmount () {
    this._observer.unobserve(this._el);
  }

  render () {
    return (
      <iframe ref={el => this._el = el} style={{border: "none"}} src={this.state.url} />
    );
  }
}


class OpenLayersMap extends Component {
  constructor (props) {
    super(props);
    this.onChange = this.onChange.bind(this);
    this.showMap = this.showMap.bind(this);
    this._innerEl = null;
  }

  showMap () {
    this.destroyMap();

    const style = this.props.style;
    this._innerEl = document.createElement("div");
    this._innerEl.style = `
      width: 100%;
      height: 100%;
    `;
    this._el.appendChild(this._innerEl);

    this._map = new OlMap({
      target: this._innerEl,
      view: new OlView({
        zoom: 2,
        center: [0, 0],
      })
    });
    olms(this._map, clone(style));
  }

  destroyMap () {
    if (this._map) {
      this._map.getLayers().clear();
      this._map.setTarget(null);
      this._map = null;
      this._el.removeChild(this._innerEl);
    }
  }

  onChange (entries, observer) {
    if (entries[0].intersectionRatio) {
      this.showMap();
    }
    else {
      this.destroyMap();
    }
  }

  componentDidMount () {
    this._observer = new IntersectionObserver(this.onChange);
    this._observer.observe(this._el);
  }

  componentWillUnmount () {
    this._observer.unobserve(this._el);
  }

  render () {
    return (
      <div style={{flex: 1}} ref={el => this._el = el} />
    );
  }
}

class Map extends Component {
  constructor (props) {
    super(props);
    this._visible = false;
    this.onChange = this.onChange.bind(this);
    this.showMap = this.showMap.bind(this);
  }

  showMap () {
    if (this._visible && !this._map) {
      this._map = new mapboxgl.Map({
        container: this._el, // container id
        style: this.props.style,
        zoom: 1,
        center: [0, 0],
      });
      this._map.addControl(new mapboxgl.NavigationControl());
      window.map = this._map;
    }
  }

  onChange (entries, observer) {
    if (entries[0].intersectionRatio) {
      this._visible = true;
      setTimeout(this.showMap, 450);
    }
    else if (this._map) {
      this._visible = false;
      this._map.remove();
      this._map = undefined;
    }
  }

  componentDidMount () {
    this._observer = new IntersectionObserver(this.onChange);
    this._observer.observe(this._el);
  }

  componentWillUnmount () {
    this._observer.unobserve(this._el);
  }

  render () {
    return (
      <div ref={el => this._el = el} />
    );
  }
}

class Home extends Component {
  render () {
    return (
      <div className="Home">
        <header>
          <div className="content">
            <h1>mapbox-gl-render-compare</h1>
            <p>
              Show the ways in which <a href="https://www.npmjs.com/package/ol-mapbox-style">ol-mapbox-style</a> rendering differs from <a href="https://www.npmjs.com/package/mapbox-gl">mapbox-gl</a>. Because <a href="https://www.npmjs.com/package/ol-mapbox-style">ol-mapbox-style</a> only supports a subset of the spec, use this tool to find out what is supported and find out how it differs.
            </p>
          </div>
        </header>
        <div>
          <div className="content">
            {styles.map((style, idx) => {
              if (style.style) {
                return (
                  <div key={idx}>
                    <h2>
                      <code>{style.id}</code>
                    </h2>
                    <div className="style">
                      <div
                        className="style__renderer style__renderer--ol"
                      >
                        <OpenLayersMapIframe {...style} style={style.id} />
                      </div>
                      <div
                        className="style__renderer style__renderer--mgl"
                      >
                        <Map {...style} style={style.style} />
                      </div>
                    </div>
                    <pre><code>{JSON.stringify(style.style, null, 2)}</code></pre>
                  </div>
                );
              }
              else {
                return (
                  <div>
                    <h2>
                      <code>{style.path}</code>
                    </h2>
                    <p>
                      Missing
                    </p>
                  </div>
                );
              }
            })}
          </div>
        </div>
        <footer>
          <div className="content">
            Made by a <a href="https://github.com/orangemug">Mug</a>
          </div>
        </footer>
      </div>
    );
  }
}


class Ol extends Component {
  render () {
    const url = new URL(`http://example.com/${this.props.url}`);
    const styleId = url.searchParams.get("style");
    let styleObj = styles.find(s => s.id === styleId) || {};

    return (
      <div style={{height: "100vh", width: "100%", display: "flex"}}>
        <OpenLayersMap style={styleObj.style} />
      </div>
    );
  }
}

class App extends Component {

  constructor () {
    super();

    this.state = {};
  }

  render() {
    return (
      <Router history={createHashHistory()}>
        <Home path={`/`} {...this.state} />
        <Ol path={`/ol`} {...this.state} />
      </Router>
    );
  }

}


// render an instance of Clock into <body>:
render(<App />, document.body);

