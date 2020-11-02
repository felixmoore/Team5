package Team5.sprites;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.Texture;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.math.Vector2;
import com.badlogic.gdx.utils.Null;

import java.awt.*;
import java.util.Random;

public class Player extends Sprite {
    Vector2 position;
    String id;
    Color colour;

    public Player(Texture texture){
        super(texture);
        colour = generateColour();

    }
    public Player(Texture texture, String id, float x, float y){ //used to construct other players
        super(texture);
        setX(x);
        setY(y);
        setID(id);
        if (colour == null){ colour = generateColour(); }
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

    public Color getColour() { return colour; }

    public void setColour(Color colour){
        this.colour = colour;
    }

    public boolean moved(){
        return (position.x != getX() || position.y != getY());
    }

    public Color generateColour(){
        Random rnd = new Random();
        float r = rnd.nextFloat();
        float g = rnd.nextFloat();
        float b = rnd.nextFloat();
        return new Color(r, g, b, 1);
    }
}
