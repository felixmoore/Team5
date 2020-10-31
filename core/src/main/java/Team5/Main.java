package Team5;

import Team5.sprites.Player;
import com.badlogic.gdx.ApplicationAdapter;
import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.Input;
import com.badlogic.gdx.graphics.GL20;
import com.badlogic.gdx.graphics.Texture;
import com.badlogic.gdx.graphics.g2d.SpriteBatch;
import io.socket.client.Socket;
import io.socket.client.IO;
import io.socket.emitter.Emitter;
import org.json.JSONException;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;

//TODO edit so that the client movement is done through update requests instead of locally
//     this will make it harder to cheat :)

/** {@link com.badlogic.gdx.ApplicationListener} implementation shared by all platforms. */
public class Main extends ApplicationAdapter {
	private SpriteBatch batch;
	private Texture image;
	private Socket socket;
	private Texture playerTexture;
	private Player player;
	private List<Player> otherPlayers;
	private final float UPDATE_FREQUENCY = 1/60f; //60x per second, can be changed
	private float timer;

	@Override
	public void create() {
		batch = new SpriteBatch();
		image = new Texture("badlogic.png");
		playerTexture = new Texture("circle.png");
		otherPlayers = new ArrayList<>();
		connectSocket();
		configConnectionEvents();
	}

	@Override
	public void render() {

		Gdx.gl.glClearColor(1, 1, 1, 1);
		Gdx.gl.glClear(GL20.GL_COLOR_BUFFER_BIT);
		batch.begin();
		//batch.draw(image, 165, 180);
		if (player != null){
			handlePlayerInput();
			update(Gdx.graphics.getDeltaTime()); //delta time = time since last called (?)
			player.draw(batch);
		}

		for (Player p: otherPlayers){
			p.draw(batch);
		}
		batch.end();
	}

	@Override
	public void dispose() {
		batch.dispose();
		image.dispose();
		playerTexture.dispose();
	}

	public void connectSocket(){
		try{
			socket = IO.socket("http://localhost:3000"); //TODO will need to be changed for an external server
			socket.connect();
		} catch (Exception e){
			System.out.println(e);
		}
	}


	/**
	 * Function to handle incoming data from index.js  created by SocketIO connections
	 * TODO tidy up
	 */
	public void configConnectionEvents(){
		socket.on(Socket.EVENT_CONNECT, new Emitter.Listener() { //new user connected
			@Override
			public void call(Object... args) {
				Gdx.app.log("SocketIO", "Connected");
				player = new Player(playerTexture);
				System.out.println("Got here");
			}
		}).on("socketID", new Emitter.Listener() { //user details received, stored in Player object
			@Override
			public void call(Object... args) {
				JSONObject data = (JSONObject) args[0];
				try {
					player.setID(data.getString("id"));

					player.initialiseLocation(Float.parseFloat(data.getString("x")), Float.parseFloat(data.getString("y")));
					Gdx.app.log("SocketIO", "My ID: "+ player.getID());

				} catch (JSONException e) {
					Gdx.app.log("SocketIO", "Error retrieving User ID.");
				}

			}
		}).on("newPlayer", new Emitter.Listener() { //other player connection
			@Override
			public void call(Object... args) {
				JSONObject data = (JSONObject) args[0];
				try {
					String id = data.getString("id");
					Gdx.app.log("SocketIO", "New player connected - ID: "+id);
					float x = (float) Integer.parseInt(data.getString("x"));
					float y = (float) Integer.parseInt(data.getString("y"));
					otherPlayers.add(new Player(playerTexture, id, x, y));

				} catch (JSONException e) {
					Gdx.app.log("SocketIO", "Error retrieving User ID.");
				}
			}
		}).on("playerDisconnected", new Emitter.Listener() {
			@Override
			public void call(Object... args) {
				JSONObject data = (JSONObject) args[0];
				try {
					String id = data.getString("id");
					Gdx.app.log("SocketIO", "Player disconnected - ID: " + id);

					otherPlayers.remove(id);
				} catch (JSONException e) {
					Gdx.app.log("SocketIO", "Error retrieving User ID.");
				}
			}
		}).on("currentPlayers", new Emitter.Listener() {
			@Override
			public void call(Object... args) {
				try {
					JSONObject players = new JSONObject(args[0].toString());
					for (int i=0; i<players.length(); i++){
						Player otherPlayer = new Player(playerTexture,
								players.getJSONObject(String.valueOf(i)).getString("id"),
								(float) players.getJSONObject(String.valueOf(i)).getDouble("x"),
								(float) players.getJSONObject(String.valueOf(i)).getDouble("y"));
						otherPlayers.add(otherPlayer);
					}
				} catch (JSONException e) {
					Gdx.app.log("SocketIO", "Error retrieving User ID.");
				}
			}
		}).on("playerMoved", new Emitter.Listener() {
			@Override
			public void call(Object... args) {
				JSONObject data = (JSONObject) args[0];
				try {
					String id = data.getString("id");
					float x = (float) data.getDouble("x");
					float y = (float) data.getDouble("y");

					for (Player p : otherPlayers){

						if (p.getID().equals(id)) {
							System.out.println("DEBUG matched ID successfully");
							p.setPosition(x, y);
						}
					}
				} catch (JSONException e) {
					Gdx.app.log("SocketIO", "Error retrieving User ID.");
				}
			}
		});
	}

	/**
	 * Handles movement.
	 * TODO add movement smoothing
	 */
	public void handlePlayerInput(){
		if (Gdx.input.isKeyPressed(Input.Keys.UP)){
			player.setY(player.getY()+10);
		} else if (Gdx.input.isKeyPressed(Input.Keys.DOWN)){
			player.setY(player.getY()-10);
		}

		if (Gdx.input.isKeyPressed(Input.Keys.LEFT)){
			player.setX(player.getX()-10);
		} else if (Gdx.input.isKeyPressed(Input.Keys.RIGHT)){
			player.setX(player.getX()+10);
		}
	}

	public void update(float dt){
		timer += dt;
		if (timer >= UPDATE_FREQUENCY) {
			if (player != null && player.moved()) {
				try {
					JSONObject update = new JSONObject();
					update.put("x", player.getX());
					update.put("y", player.getY());
					socket.emit("playerMoved", update);
				} catch (JSONException e) {
					Gdx.app.log("Socket.IO", "TODO JSON exception"); //todo make more descriptive
				}
			}
		}
	}
}