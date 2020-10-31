package Team5.sprites;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.graphics.Texture;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.math.Vector2;
import com.badlogic.gdx.utils.Null;

public class Player extends Sprite {
    Vector2 position;
    String id;

    public Player(Texture texture){
        super(texture);

    }
    public Player(Texture texture, String id, float x, float y){ //used to construct other players
        super(texture);
        setX(x);
        setY(y);
        setID(id);
        position = new Vector2(x,y);
    }

    public void initialiseLocation(float x, float y){
        setX(x);
        setY(y);
        position = new Vector2(x,y);
    }

    public void setID(String id){
        this.id = id;
    }

    public String getID(){
        return id;
    }

    public boolean moved(){
        return (position.x != getX() || position.y != getY());
    }

}
