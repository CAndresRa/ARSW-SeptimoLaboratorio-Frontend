import logo from './logo.svg';
import './App.css';
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import './MainPage.css';
import { Button, Form, FormGroup, Label, Input } from 'reactstrap';
import {BrowserRouter as Router, Route, Redirect, Switch} from 'react-router-dom';
import { Link, withRouter } from 'react-router-dom';
import axios from 'axios';

// WebSocket ===================================================
function ServiceURLtoGame(roomName) {
    //carlostictactoeback.herokuapp.com
    var host = 'carlostictactoeback.herokuapp.com';
    var url = 'wss://' + (host) + '/room/' + roomName;
    console.log("URL Calculada Con game: " + url);
    return url;
}

function ServiceURL(roomName) {
    //carlostictactoeback.herokuapp.com
    var host = 'carlostictactoeback.herokuapp.com';
    var url = 'wss://' + (host) + '/tictactoe/' + roomName;
    console.log("URL Calculada: " + url);
    return url;
}

class WebSocketChannel {
    constructor(URL, callback) {
        this.URL = URL;
        this.wsocket = new WebSocket(URL);
        this.wsocket.onopen = (evt) => this.onOpen(evt);
        this.wsocket.onmessage = (evt) => this.onMessage(evt);
        this.receivef = callback;
    }

    onOpen(evt) {
        console.log("In onOpen", evt);
    }

    onMessage(evt) {
        console.log("In onMessage", evt);
        // Este if permite que el primer mensaje del servidor no se tenga en cuenta.
        // El primer mensaje solo confirma que se estableció la conexión.
        // De ahí en adelante intercambiaremos solo puntos(x,y) con el servidor
        if (evt.data != "Connection established.") {
            this.receivef(evt.data);
        }
    }
    onError(evt) {
        console.error("In onError", evt);
    }

    onClose(evt){
      alert('connection closed');};

  send(i) {
    let msg = i;
    console.log("sending: ", msg);
    this.wsocket.send(msg);
  }
}

// Main Page =================================
class MainPage extends React.Component {

  constructor(props){
    super(props);
    this.state = {
      userName : '',
      roomName : ''
    }
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChangeUsername = this.handleChangeUsername.bind(this);
    this.handleChangeRoomName = this.handleChangeRoomName.bind(this);
  }

  handleSubmit(event) {
    event.preventDefault();
    console.log("click");
    const { history } = this.props;
    history.push('/room/' + this.state.roomName);
  }

  handleChangeUsername(event){
    this.setState({ userName: event.target.value});
    console.log(this.state.userName);
  }

  handleChangeRoomName(event){
    this.setState({roomName: event.target.value});
    console.log(this.state.roomName);
  }

  render(){
    return(
      <div className="login-form">
        <h1>
          <span className="font-weight-bold text-center text-white">Tic Tac Toe</span>
        </h1>
        <h3 className="text-center text-white">Crear Sala</h3>
        <Form onSubmit={this.handleSubmit}>
          <FormGroup>
            <Label className="text-white">Nombre</Label>
            <Input type="text" placeholder="Nombre" name="name" onChange={this.handleChangeUsername}/>
          </FormGroup>
          <FormGroup>
            <Label className="text-white">Room</Label>
            <Input type="text" placeholder="IdRoom" name="roomName" onChange={this.handleChangeRoomName}/>
          </FormGroup>
          <Button type="submit" className="btn-lg btn-dark btn-block"> Unirse </Button>
        </Form>
      </div>
    );
  }

}

// TIC TAC TOE ================================================

function Square (props) {
    return (
      <button
      className="square"
      onClick={props.onClick}>
        {props.value}
      </button>
    );
}

class Board extends React.Component {
  constructor(props){
    super(props);
    console.log(window.location.pathname.split("/"));
    this.state = {
      squares: Array(9).fill(null),
      xIsNext: true,
    };
    this.backMove = this.backMove.bind(this);
    this.comunicationWS =
    new WebSocketChannel(ServiceURLtoGame(window.location.pathname.split("/")[2]),
        (msg) => {
            var obj = JSON.parse(msg);
            console.log("On func call back ", msg);
            this.update(obj);
        });
    }

  handleClick(i){
    const squares = this.state.squares.slice();
    if(calculateWinner(squares) || squares[i]){
      return;
    }
    squares[i] = this.state.xIsNext ? 'X':'O';
    this.setState({
      squares: squares,
      xIsNext: !this.state.xIsNext,
    }, () => {
      this.comunicationWS.send(JSON.stringify(this.state));
    });

    console.log(this.state)
  }

  backMove(event){
    event.preventDefault();
      this.comunicationWS.send("back");

  }

  update(i){
    this.setState(i);
  }




  renderSquare(i) {
    return <Square value={this.state.squares[i]}
    onClick= {() => this.handleClick(i)}
    />;
  }

  render() {
    const winner = calculateWinner(this.state.squares);
    let status;
    if (winner){
      status = 'Winner: ' + winner;
    } else {
      status = 'Next player: ' + (this.state.xIsNext ? 'X':'O');
    }

    return (
      <div>
        <div className="status">{status}</div>
        <div className="board-row">
          {this.renderSquare(0)}
          {this.renderSquare(1)}
          {this.renderSquare(2)}
        </div>
        <div className="board-row">
          {this.renderSquare(3)}
          {this.renderSquare(4)}
          {this.renderSquare(5)}
        </div>
        <div className="board-row">
          {this.renderSquare(6)}
          {this.renderSquare(7)}
          {this.renderSquare(8)}
        </div>
        <Form onSubmit={this.backMove}>
          <Button type="submit" className="btn-lg btn-dark btn-block"> Regresar Movimiento </Button>
        </Form>
      </div>

    );
  }
}

class Game extends React.Component {
  render() {
    return (
      <div className="game">
        <div className="game-board">
          <Board />
        </div>
        <div className="game-info">
          <div>{/* status */}</div>
          <ol>{/* TODO */}</ol>
        </div>
      </div>
    );
  }
}

function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}

// Router    ========================================

class App extends React.Component{
  render(){
    return(
      <Router>
        <Switch>
          <Route path="/" exact={true} component = {MainPage}/>
          <Route path="/room/:id" exact={true} component={Game} />
        </Switch>
      </Router>
    )
  }
}


export default App;
