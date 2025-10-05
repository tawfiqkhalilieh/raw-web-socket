const output = document.getElementById("stream-output")
const inp = document.getElementById("inp")


const retrive_messages_array = () => JSON.parse(localStorage.getItem("messages") || "[]");

const add_to_messages_array = (value) => {
  const array = retrive_messages_array()
  array.push(value);

  localStorage.setItem("messages", JSON.stringify(array))
}

const show_message = (value) => {
  const  message = document.createElement("div");
  const content = document.createElement("span");
           
    content.innerHTML = value;

    message.appendChild(content)
    output.appendChild(message)

}

const load_from_storage = () => {
  const messages = retrive_messages_array();

  for ( const value of messages ) {
    show_message(value)
  }
}

document.getElementById('inp').addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    if ( inp.value === "") return;
    
    const message_value =  inp.value

    inp.value = ''

    show_message(
      "You: " + message_value
    )

    add_to_messages_array("You: " +message_value)

    socket.send(message_value)

  } 
});


load_from_storage()

const socket = new WebSocket('ws://localhost:8000');

socket.onmessage = (event) => {
  const data = event.data

  if ( data.includes("\u0003é")) return; // connection

  add_to_messages_array(data)
	

  show_message(
    data  
  )

};


socket.onerror = (err) => {
  console.error(err);
}
