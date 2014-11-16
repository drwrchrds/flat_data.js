

def check_intervals(num)
  best_intervals = []
  current_max = 0
  
  num.upto(255).each do |interval|
    picked_already = [0]

    next_color = interval
    until picked_already.include?(next_color)
      picked_already << next_color
      next_color += interval
      next_color = next_color % 255
    end
  
    num_colors = picked_already.length
    if num_colors > current_max
      best_intervals = [[interval, num_colors]]
      current_max = num_colors
    elsif num_colors == current_max
      best_intervals << [interval, num_colors]
    end
  end
  best_intervals
end