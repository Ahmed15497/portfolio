

class SocketConnector():

    def __init__(self, host, port):
        self.host = host 
        self.port = port 

    def __eq__(self, socket_connector):
        if not isinstance(socket_connector, SocketConnector):
            return NotImplemented
        return ( (self.host == socket_connector.host) and (self.port == socket_connector.port) )
    
    def __hash__(self):
        # Hash based on the id to use in a set
        return hash(f"{self.host}:{self.port}")
    
    def __str__(self):
        return f"{self.host}:{self.port}"
    
    def __repr__(self):
        return f"{self.host}:{self.port}"

    
        